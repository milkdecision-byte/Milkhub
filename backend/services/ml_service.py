"""
ML Service — RandomForestClassifier (decision prediction) +
             IsolationForest (fraud / anomaly detection)
"""
from __future__ import annotations
import os
import numpy as np
import joblib
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Feature order must match training
FEATURE_COLS = [
    "fat", "snf", "ph", "acidity", "temperature",
    "specific_gravity", "mbrt", "cob_test_num"
]

DECISION_LABELS = ["accept", "reject"]


class MLService:
    """
    Wrapper around trained joblib models for different milk types.
    Falls back gracefully to 'cow' when specific models are not yet trained.
    """

    def __init__(self, models_path: str):
        self.models_path = models_path
        self.classifiers = {}
        self.isolators = {}
        self.scalers = {}
        self._load_models()

    # ── Load ──────────────────────────────────────────────────────────────

    def _load_models(self):
        for mtype in ["cow", "buffalo"]:
            try:
                clf_path = os.path.join(self.models_path, f"decision_model_{mtype}.pkl")
                iso_path = os.path.join(self.models_path, f"fraud_model_{mtype}.pkl")
                scaler_path = os.path.join(self.models_path, f"scaler_{mtype}.pkl")

                if os.path.exists(clf_path):
                    self.classifiers[mtype] = joblib.load(clf_path)
                    logger.info(f"Decision model for {mtype} loaded.")
                if os.path.exists(iso_path):
                    self.isolators[mtype] = joblib.load(iso_path)
                    logger.info(f"Fraud model for {mtype} loaded.")
                if os.path.exists(scaler_path):
                    self.scalers[mtype] = joblib.load(scaler_path)
                    logger.info(f"Scaler for {mtype} loaded.")
            except Exception as e:
                logger.warning(f"Could not load ML models for {mtype}: {e}")

    # ── Predict Decision ──────────────────────────────────────────────────

    def predict_decision(self, features: dict, milk_type: str = "cow") -> tuple[str, float]:
        """
        Returns (label, confidence).
        Falls back to 'cow' if specific model not loaded.
        """
        clf = self.classifiers.get(milk_type) or self.classifiers.get("cow")
        scaler = self.scalers.get(milk_type) or self.scalers.get("cow")

        if clf is None:
            return "unknown", 0.0

        try:
            X = self._build_feature_vector(features)
            if scaler:
                X = scaler.transform(X)
            probs = clf.predict_proba(X)[0]
            idx = int(np.argmax(probs))
            label = DECISION_LABELS[idx]
            confidence = float(probs[idx])
            return label, confidence
        except Exception as e:
            logger.warning(f"Prediction failed: {e}")
            return "unknown", 0.0

    # ── Fraud Score ───────────────────────────────────────────────────────

    def fraud_score(self, features: dict, milk_type: str = "cow") -> float:
        """
        Returns anomaly score (higher = more anomalous).
        """
        iso = self.isolators.get(milk_type) or self.isolators.get("cow")
        scaler = self.scalers.get(milk_type) or self.scalers.get("cow")

        if iso is None:
            return 0.0
        try:
            X = self._build_feature_vector(features)
            if scaler:
                X = scaler.transform(X)
            score = float(-iso.score_samples(X)[0])
            score = min(max((score + 0.5) / 1.0, 0.0), 1.0)
            return round(score, 4)
        except Exception as e:
            logger.warning(f"Fraud score failed: {e}")
            return 0.0

    # ── Helpers ───────────────────────────────────────────────────────────

    def _build_feature_vector(self, features: dict) -> np.ndarray:
        row = []
        for col in FEATURE_COLS:
            row.append(float(features.get(col) or 0.0))
        return np.array(row).reshape(1, -1)

    @staticmethod
    def encode_categorical(sample: dict) -> dict:
        """Convert categorical fields to numeric for ML."""
        out = dict(sample)
        out["cob_test_num"] = 1.0 if str(sample.get("cob_test", "")).lower() == "positive" else 0.0
        out["alcohol_test_num"] = 1.0 if str(sample.get("alcohol_test", "")).lower() == "positive" else 0.0
        out["organoleptic_num"] = 1.0 if str(sample.get("organoleptic", "")).lower() == "abnormal" else 0.0
        out["sediment_test_num"] = 1.0 if str(sample.get("sediment_test", "")).lower() == "dirty" else 0.0
        return out

    def models_ready(self) -> bool:
        return len(self.classifiers) > 0 and len(self.isolators) > 0
