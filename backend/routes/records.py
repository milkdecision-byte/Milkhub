"""
Records & Dashboard Routes
GET /api/records
GET /api/records/:id
GET /api/dashboard
GET /api/farmers
GET /api/farmers/:id
"""
from __future__ import annotations
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, and_
from datetime import datetime, timedelta, date

from models.database import db, MilkRecord, Farmer

records_bp = Blueprint("records", __name__)
dashboard_bp = Blueprint("dashboard", __name__)
farmers_bp = Blueprint("farmers", __name__)


# ── Records ────────────────────────────────────────────────────────────────────

@records_bp.get("")
@jwt_required()
def get_records():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))
    decision = request.args.get("decision")
    fraud_risk = request.args.get("fraud_risk")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    shift = request.args.get("shift")
    batch_id = request.args.get("batch_id")
    search = request.args.get("search", "").strip()

    q = MilkRecord.query

    if decision:
        q = q.filter(MilkRecord.decision == decision)
    if fraud_risk:
        q = q.filter(MilkRecord.fraud_risk == fraud_risk)
    if shift:
        q = q.filter(MilkRecord.shift == shift)
    if batch_id:
        q = q.filter(MilkRecord.batch_id == batch_id)
    if date_from:
        try:
            q = q.filter(MilkRecord.date >= datetime.strptime(date_from, "%Y-%m-%d").date())
        except ValueError:
            pass
    if date_to:
        try:
            q = q.filter(MilkRecord.date <= datetime.strptime(date_to, "%Y-%m-%d").date())
        except ValueError:
            pass
    if search:
        q = q.filter(
            MilkRecord.farmer_name.ilike(f"%{search}%") |
            MilkRecord.farmer_code.ilike(f"%{search}%")
        )

    q = q.order_by(MilkRecord.created_at.desc())
    paginated = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "records": [r.to_dict() for r in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "page": page,
        "per_page": per_page,
    }), 200


@records_bp.get("/<int:record_id>")
@jwt_required()
def get_record(record_id):
    rec = MilkRecord.query.get_or_404(record_id)
    return jsonify({"record": rec.to_dict()}), 200


# ── Dashboard ──────────────────────────────────────────────────────────────────

@dashboard_bp.get("")
@jwt_required()
def get_dashboard():
    req_date = request.args.get("date")
    shift = request.args.get("shift", "").lower()
    batch_id = request.args.get("batch_id")

    if req_date:
        try:
            target_date = datetime.strptime(req_date, "%Y-%m-%d").date()
        except ValueError:
            target_date = date.today()
    else:
        target_date = date.today()

    # ── Auto-fallback: if no batch is selected and the requested date has 0 records,
    # resolve to the most recent date that actually has data.
    # This handles the common case where bulk-uploaded CSVs contain a different date
    # (e.g. 2026-06-05) from the server's current date (e.g. 2026-05-11).
    if not batch_id:
        count_for_target = MilkRecord.query.filter(MilkRecord.date == target_date).count()
        if count_for_target == 0:
            latest = db.session.query(func.max(MilkRecord.date)).scalar()
            if latest:
                target_date = latest

    thirty_ago = target_date - timedelta(days=30)

    # Base Query for Dashboard Data — build once, snapshot as subquery immediately.
    # Using a subquery of IDs (base_ids) ensures all subsequent queries use the
    # exact same filter conditions without any risk of mutation.
    base_q = MilkRecord.query

    if batch_id:
        base_q = base_q.filter(MilkRecord.batch_id == batch_id)
    else:
        base_q = base_q.filter(MilkRecord.date == target_date)
        if shift and shift not in ("fullday", "full day", "all", ""):
            base_q = base_q.filter(MilkRecord.shift == shift)

    # Capture filtered IDs as a query — passed directly to .in_() below
    base_ids_q = base_q.with_entities(MilkRecord.id)

    # KPI aggregates — all computed via fresh queries scoped to base_ids_subq
    agg = db.session.query(
        func.count(MilkRecord.id).label("total"),
        func.sum(db.case((MilkRecord.decision == "accept", 1), else_=0)).label("accepted"),
        func.sum(db.case((MilkRecord.decision == "reject", 1), else_=0)).label("rejected"),
        func.sum(db.case((MilkRecord.fraud_risk == "high", 1), else_=0)).label("fraud_high"),
        func.sum(db.case((MilkRecord.fraud_risk == "medium", 1), else_=0)).label("fraud_medium"),
        func.sum(db.case((MilkRecord.shift == "morning", MilkRecord.quantity), else_=0)).label("morning_qty"),
        func.sum(db.case((MilkRecord.shift == "evening", MilkRecord.quantity), else_=0)).label("evening_qty"),
    ).filter(MilkRecord.id.in_(base_ids_q)).one()

    total        = agg.total or 0
    accepted     = int(agg.accepted or 0)
    rejected     = int(agg.rejected or 0)
    fraud_high   = int(agg.fraud_high or 0)
    fraud_medium = int(agg.fraud_medium or 0)
    morning_qty  = float(agg.morning_qty or 0)
    evening_qty  = float(agg.evening_qty or 0)

    # Daily trend (last 30 days) - this should probably NOT be filtered by current date/batch
    # otherwise it will only show 1 day.
    # The trend should show the last 30 days up to the target_date
    trend_q = db.session.query(
        MilkRecord.date,
        MilkRecord.decision,
        func.count(MilkRecord.id).label("cnt"),
    ).filter(
        MilkRecord.date >= thirty_ago,
        MilkRecord.date <= target_date
    )
    if shift and shift not in ("fullday", "full day", "all", "") and not batch_id:
        trend_q = trend_q.filter(MilkRecord.shift == shift)
        
    daily_rows = trend_q.group_by(MilkRecord.date, MilkRecord.decision).all()

    daily_map: dict = {}
    for row in daily_rows:
        key = str(row.date)
        if key not in daily_map:
            daily_map[key] = {"date": key, "accept": 0, "reject": 0}
        daily_map[key][row.decision] = row.cnt
    daily_trend = sorted(daily_map.values(), key=lambda x: x["date"])

    # Top farmers (by accepted count) for the selected session/date
    top_farmers = db.session.query(
        MilkRecord.farmer_name,
        MilkRecord.farmer_code,
        func.count(MilkRecord.id).label("total"),
        func.sum(
            db.case((MilkRecord.decision == "accept", 1), else_=0)
        ).label("accepted"),
        func.sum(MilkRecord.quantity).label("total_qty"),
    ).filter(
        MilkRecord.id.in_(base_ids_q)
    ).group_by(
        MilkRecord.farmer_name, MilkRecord.farmer_code
    ).order_by(
        func.count(MilkRecord.id).desc()
    ).limit(10).all()

    top_farmers_list = [
        {
            "farmer_name": r.farmer_name,
            "farmer_code": r.farmer_code,
            "total": r.total,
            "accepted": int(r.accepted or 0),
            "total_qty": float(r.total_qty or 0),
        }
        for r in top_farmers
    ]

    # Shift comparison
    shift_data = db.session.query(
        MilkRecord.shift,
        func.count(MilkRecord.id).label("cnt"),
        func.sum(MilkRecord.quantity).label("qty"),
    ).filter(
        MilkRecord.id.in_(base_ids_q)
    ).group_by(MilkRecord.shift).all()

    shift_map = {r.shift: {"count": r.cnt, "quantity": float(r.qty or 0)} for r in shift_data}

    return jsonify({
        "session_info": {
            "date": str(target_date),
            "shift": shift if shift else "Full Day",
            "batch_id": batch_id,
            "resolved_date": str(target_date)
        },
        "kpis": {
            "total": total,
            "accepted": accepted,
            "rejected": rejected,
            "fraud_high": fraud_high,
            "fraud_medium": fraud_medium,
            "morning_qty": float(morning_qty),
            "evening_qty": float(evening_qty),
        },
        "daily_trend": daily_trend,
        "top_farmers": top_farmers_list,
        "shift_comparison": shift_map,
        "accept_rate": round(accepted / total * 100, 1) if total else 0,
        "reject_rate": round(rejected / total * 100, 1) if total else 0,
    }), 200


# ── Farmers ────────────────────────────────────────────────────────────────────

@farmers_bp.get("")
@jwt_required()
def list_farmers():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))
    search = request.args.get("search", "").strip()
    fraud_only = request.args.get("fraud_only", "false").lower() == "true"

    q = Farmer.query
    if search:
        q = q.filter(
            Farmer.full_name.ilike(f"%{search}%") |
            Farmer.farmer_code.ilike(f"%{search}%")
        )
    if fraud_only:
        q = q.filter(Farmer.fraud_flag == True)

    q = q.order_by(Farmer.registered_at.desc())
    paginated = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "farmers": [f.to_dict() for f in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
    }), 200


@farmers_bp.get("/<int:farmer_id>")
@jwt_required()
def get_farmer(farmer_id):
    from sqlalchemy import or_
    farmer = Farmer.query.get_or_404(farmer_id)

    # Build a flexible filter: match by farmer_id (set for most records)
    # OR by farmer_code (covers uploaded records where farmer_id may differ or
    # older records linked only by code), OR by farmer_name if no code exists.
    conditions = [MilkRecord.farmer_id == farmer_id]
    if farmer.farmer_code:
        conditions.append(MilkRecord.farmer_code == farmer.farmer_code)
    if farmer.full_name:
        conditions.append(
            and_(
                MilkRecord.farmer_name == farmer.full_name,
                (MilkRecord.farmer_code == None) | (MilkRecord.farmer_code == "")
            )
        )

    records = (
        MilkRecord.query
        .filter(or_(*conditions))
        .order_by(MilkRecord.date.desc(), MilkRecord.created_at.desc())
        .limit(100)
        .all()
    )

    # Deduplicate by record id (in case multiple conditions matched same row)
    seen = set()
    unique_records = []
    for r in records:
        if r.id not in seen:
            seen.add(r.id)
            unique_records.append(r)

    return jsonify({
        "farmer": farmer.to_dict(),
        "records": [r.to_dict() for r in unique_records],
    }), 200

@farmers_bp.delete("/<int:farmer_id>")
@jwt_required()
def delete_farmer(farmer_id):
    farmer = Farmer.query.get_or_404(farmer_id)
    # Set farmer_id to null for historical records to keep analytics intact
    MilkRecord.query.filter_by(farmer_id=farmer_id).update({"farmer_id": None})
    db.session.delete(farmer)
    db.session.commit()
    return jsonify({"message": "Farmer deleted successfully"}), 200
