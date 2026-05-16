"""
Settings Routes
GET  /api/settings
POST /api/settings
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from models.database import db, Setting

settings_bp = Blueprint("settings", __name__)


@settings_bp.get("")
@jwt_required()
def get_settings():
    settings = Setting.query.all()
    return jsonify({s.setting_key: s.setting_value for s in settings}), 200


@settings_bp.post("")
@jwt_required()
def update_settings():
    claims = get_jwt()
    if claims.get("role") not in ("admin",):
        return jsonify({"error": "Admin access required"}), 403

    uid = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    for key, value in data.items():
        setting = Setting.query.filter_by(setting_key=key).first()
        if setting:
            setting.setting_value = str(value)
            setting.updated_by = uid
        else:
            db.session.add(Setting(
                setting_key=key,
                setting_value=str(value),
                updated_by=uid,
            ))

    db.session.commit()
    return jsonify({"message": "Settings updated"}), 200


@settings_bp.post("/retrain")
@jwt_required()
def retrain_models():
    claims = get_jwt()
    if claims.get("role") not in ("admin",):
        return jsonify({"error": "Admin access required"}), 403

    try:
        from ml.train_models import train
        train()
        
        from flask import current_app
        ml_svc = current_app.config.get("ML_SERVICE")
        if ml_svc:
            ml_svc._load_models()
            
        return jsonify({"message": "Models retrained successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Retraining failed: {e}"}), 500
