"""
ML Training Script — Support for Cow and Buffalo Milk
==================================================
Run once to generate synthetic training data and train:
  - decision_model_cow.pkl / buffalo.pkl
  - fraud_model_cow.pkl / buffalo.pkl
  - scaler_cow.pkl / buffalo.pkl
"""
from __future__ import annotations
import os
import sys
import numpy as np
import joblib
import logging

from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

SAVE_PATH = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(SAVE_PATH, exist_ok=True)

FEATURE_COLS = [
    "fat", "snf", "ph", "acidity", "temperature",
    "specific_gravity", "mbrt", "cob_test_num",
]

rng = np.random.default_rng(42)

# ── Standards ──────────────────────────────────────────────────────────

COW_STANDARDS = {
    "fat_min": 3.2, "fat_max": 3.5,
    "snf_min": 8.3, "snf_max": 8.5,
    "ph_min": 6.5, "ph_max": 6.8,
    "acidity_min": 0.10, "acidity_max": 0.15,
    "temp_acceptable": 15.0,
    "sg_min": 1.028, "sg_max": 1.032,
    "mbrt_check": 120.0,
}



# ── Generators ─────────────────────────────────────────────────────────

def make_sample(standards, is_accept=True):
    if is_accept:
        return {
            "fat": rng.uniform(standards["fat_min"], standards["fat_max"]),
            "snf": rng.uniform(standards["snf_min"], standards["snf_max"]),
            "ph": rng.uniform(standards["ph_min"], standards["ph_max"]),
            "acidity": rng.uniform(standards["acidity_min"], standards["acidity_max"]),
            "temperature": rng.uniform(4, standards["temp_acceptable"]),
            "specific_gravity": rng.uniform(standards["sg_min"], standards["sg_max"]),
            "mbrt": rng.uniform(standards["mbrt_check"] / 60.0 + 1.0, 6.0),
            "cob_test_num": 0,
        }
    else:
        s = make_sample(standards, is_accept=True)
        choice = rng.integers(0, 8)
        if choice == 0:
            s["cob_test_num"] = 1
        elif choice == 1:
            s["mbrt"] = rng.uniform(0.5, standards["mbrt_check"] / 60.0 - 0.1)
        elif choice == 2:
            s["fat"] = rng.choice([rng.uniform(1.0, standards["fat_min"] - 0.1), rng.uniform(standards["fat_max"] + 0.1, 10.0)])
        elif choice == 3:
            s["snf"] = rng.choice([rng.uniform(5.0, standards["snf_min"] - 0.1), rng.uniform(standards["snf_max"] + 0.1, 12.0)])
        elif choice == 4:
            s["ph"] = rng.choice([rng.uniform(5.0, standards["ph_min"] - 0.1), rng.uniform(standards["ph_max"] + 0.1, 8.0)])
        elif choice == 5:
            s["temperature"] = rng.uniform(standards["temp_acceptable"] + 0.1, 30.0)
        elif choice == 6:
            s["acidity"] = rng.choice([rng.uniform(0.01, standards["acidity_min"] - 0.01), rng.uniform(standards["acidity_max"] + 0.01, 0.30)])
        else:
            s["specific_gravity"] = rng.choice([rng.uniform(1.000, standards["sg_min"] - 0.001), rng.uniform(standards["sg_max"] + 0.001, 1.050)])
        return s

def generate_dataset(standards, n_per_class: int = 2000):
    X, y = [], []
    for _ in range(n_per_class):
        s = make_sample(standards, is_accept=True)
        X.append([s[c] for c in FEATURE_COLS])
        y.append(0)
        
        s = make_sample(standards, is_accept=False)
        X.append([s[c] for c in FEATURE_COLS])
        y.append(1)
    return np.array(X, dtype=float), np.array(y)

# ── Train ──────────────────────────────────────────────────────────────

def train_models(standards: dict):
    log.info("Generating synthetic training data …")
    X, y = generate_dataset(standards, n_per_class=2000)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    log.info("Fitting StandardScaler …")
    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc = scaler.transform(X_test)

    log.info("Training RandomForestClassifier …")
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train_sc, y_train)
    preds = clf.predict(X_test_sc)
    log.info("\\nReport:")
    log.info("\\n" + classification_report(
        y_test, preds, target_names=["accept", "reject"]
    ))

    log.info("Training IsolationForest …")
    X_normal = X_train_sc[y_train == 0]
    iso = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=42,
        n_jobs=-1,
    )
    iso.fit(X_normal)

    log.info("Saving models …")
    joblib.dump(clf, os.path.join(SAVE_PATH, f"decision_model.pkl"), compress=3)
    joblib.dump(iso, os.path.join(SAVE_PATH, f"fraud_model.pkl"), compress=3)
    joblib.dump(scaler, os.path.join(SAVE_PATH, f"scaler.pkl"), compress=3)
    log.info(f"✓ Models saved to {SAVE_PATH}")

def train():
    train_models(COW_STANDARDS)

if __name__ == "__main__":
    train()
