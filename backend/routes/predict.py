"""
Predict Route
POST /api/predict   — single manual entry → instant decision
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date as dt_date

from models.database import db, MilkRecord, Farmer, Setting, UploadBatch
from services.decision_engine import DecisionEngine, MilkSample, get_engine_with_db_settings
from services.ml_service import MLService

predict_bp = Blueprint("predict", __name__)


def _get_engine() -> DecisionEngine:
    settings = {s.setting_key: s.setting_value for s in Setting.query.all()}
    return get_engine_with_db_settings(settings)


def _get_ml() -> MLService:
    return current_app.config.get("ML_SERVICE")


@predict_bp.post("")
@jwt_required()
def predict():
    uid = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    sample = MilkSample(
        fat=_f(data.get("fat")),
        snf=_f(data.get("snf")),
        ph=_f(data.get("ph")),
        acidity=_f(data.get("acidity")),
        temperature=_f(data.get("temperature")),
        specific_gravity=_f(data.get("specific_gravity")),
        cob_test=data.get("cob_test", "negative"),
        alcohol_test=data.get("alcohol_test", "negative"),
        organoleptic=data.get("organoleptic", "normal"),
        sediment_test=data.get("sediment_test", "clean"),
        mbrt=_f(data.get("mbrt")),
        raw_milk_temp=_f(data.get("raw_milk_temp")),
        quantity=_f(data.get("quantity")),
    )

    engine = _get_engine()
    result = engine.evaluate(sample)

    # ── ML Prediction ────────────────────────────────────────────────────
    ml_svc: MLService = _get_ml()
    ml_pred, ml_conf = "unknown", 0.0
    anomaly_score = 0.0
    if ml_svc:
        enc = MLService.encode_categorical(data)
        ml_pred, ml_conf = ml_svc.predict_decision(enc)
        anomaly_score = ml_svc.fraud_score(enc)

    # ── Hybrid Override: Scientific rules ALWAYS override ML ─────────────
    # If rules say reject → final = reject regardless of ML
    # ML confidence is recorded but does NOT override rule-based decision
    final_decision = result.decision
    confidence_score = ml_conf if ml_pred == final_decision else max(0.0, ml_conf - 0.15)

    # Persist record
    record_date = _parse_date(data.get("date")) or dt_date.today()
    shift = data.get("shift", "morning").lower()
    
    farmer_id = _get_or_create_farmer(
        data.get("farmer_code", ""),
        data.get("farmer_name", "Unknown"),
    )

    # Manual entry session tracking
    today_str = dt_date.today().strftime("%Y%m%d")
    batch_id = f"MANUAL_{today_str}_{shift.upper()}"
    
    upload_batch = UploadBatch.query.filter_by(batch_id=batch_id).first()
    if not upload_batch:
        upload_batch = UploadBatch(
            batch_id=batch_id,
            file_name=None,
            session_name=f"Manual Entry ({shift.capitalize()})",
            upload_date=dt_date.today(),
            shift=shift,
            uploaded_by=uid,
            total_records=0,
            accepted=0,
            rejected=0,
            fraud_alerts=0
        )
        db.session.add(upload_batch)
    
    upload_batch.total_records += 1
    if result.decision == "accept":
        upload_batch.accepted += 1
    else:
        upload_batch.rejected += 1
        
    if result.fraud_risk in ("medium", "high"):
        upload_batch.fraud_alerts += 1

    rec = MilkRecord(
        batch_id=batch_id,
        farmer_id=farmer_id,
        farmer_name=data.get("farmer_name", "Unknown"),
        farmer_code=data.get("farmer_code", ""),
        date=record_date,
        shift=shift,
        fat=sample.fat, snf=sample.snf, ph=sample.ph,
        acidity=sample.acidity, temperature=sample.temperature,
        specific_gravity=sample.specific_gravity,
        cob_test=sample.cob_test, alcohol_test=sample.alcohol_test,
        organoleptic=sample.organoleptic, sediment_test=sample.sediment_test,
        mbrt=sample.mbrt, raw_milk_temp=sample.raw_milk_temp,
        quantity=sample.quantity,
        decision=final_decision,
        reasons=result.reasons,
        fraud_risk=result.fraud_risk,
        ml_prediction=ml_pred,
        ml_confidence=ml_conf,
        model_version="2.0-hybrid",
        ml_score=confidence_score,
        entry_type="manual",
        entered_by=uid,
    )
    db.session.add(rec)
    _update_farmer_stats(farmer_id, result.decision, result.fraud_risk, sample.fat, sample.snf, sample.quantity)
    db.session.commit()

    return jsonify({
        "record_id": rec.id,
        "decision": final_decision,
        "reasons": result.reasons,
        "warnings": result.warnings,
        "fraud_risk": result.fraud_risk,
        "parameter_flags": result.parameter_flags,
        "ml_prediction": ml_pred,
        "ml_confidence": round(ml_conf * 100, 1),
        "confidence_score": round(confidence_score * 100, 1),
        "anomaly_score": round(anomaly_score * 100, 1),
        "model_version": "2.0-hybrid",
        "hybrid_override": ml_pred != final_decision,
    }), 200


# ── Helpers ────────────────────────────────────────────────────────────────────

def _f(v):
    try:
        return float(v) if v not in (None, "") else None
    except (ValueError, TypeError):
        return None


def _parse_date(v):
    if not v:
        return None
    from datetime import datetime
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d", "%d.%m.%Y", "%d.%m.%y", "%Y.%m.%d"):
        try:
            return datetime.strptime(str(v).strip(), fmt).date()
        except ValueError:
            pass
    return None


def _get_or_create_farmer(code: str, name: str) -> int | None:
    if not code and (not name or name == "Unknown"):
        return None
        
    farmer = None
    if code:
        farmer = Farmer.query.filter_by(farmer_code=code).first()
    else:
        farmer = Farmer.query.filter_by(full_name=name).first()
        
    if not farmer:
        if not code:
            import uuid
            code = f"F-{str(uuid.uuid4())[:8].upper()}"
        farmer = Farmer(farmer_code=code, full_name=name)
        db.session.add(farmer)
        db.session.flush()
    return farmer.id


def _update_farmer_stats(farmer_id, decision, fraud_risk, fat=None, snf=None, quantity=None):
    if not farmer_id:
        return
    farmer = Farmer.query.get(farmer_id)
    if not farmer:
        return
        
    old_count = farmer.total_submissions or 0
    new_count = old_count + 1
    
    farmer.total_submissions = new_count
    
    if decision == "accept":
        farmer.total_accepted = (farmer.total_accepted or 0) + 1
    elif decision == "reject":
        farmer.total_rejected = (farmer.total_rejected or 0) + 1
        
    if fraud_risk in ("medium", "high"):
        farmer.fraud_count = (farmer.fraud_count or 0) + 1
        if (farmer.fraud_count or 0) >= 3:
            farmer.fraud_flag = True
            
    if fat is not None:
        old_fat = float(farmer.avg_fat) if farmer.avg_fat else 0.0
        farmer.avg_fat = round(((old_fat * old_count) + fat) / new_count, 3)
        
    if snf is not None:
        old_snf = float(farmer.avg_snf) if farmer.avg_snf else 0.0
        farmer.avg_snf = round(((old_snf * old_count) + snf) / new_count, 3)
        
    if quantity is not None:
        old_qty = float(farmer.avg_quantity) if farmer.avg_quantity else 0.0
        farmer.avg_quantity = round(((old_qty * old_count) + quantity) / new_count, 2)
