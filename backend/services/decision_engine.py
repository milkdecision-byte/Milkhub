"""
Decision Engine — Source-of-truth rule processor for milk quality.
Implements intelligent weighted analysis and partial dataset evaluation.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional, List, Dict


@dataclass
class MilkSample:
    fat: Optional[float] = None
    snf: Optional[float] = None
    ph: Optional[float] = None
    acidity: Optional[float] = None
    temperature: Optional[float] = None
    specific_gravity: Optional[float] = None
    cob_test: Optional[str] = None          # "positive" | "negative"
    alcohol_test: Optional[str] = None      # "pass" | "fail"
    organoleptic: Optional[str] = None        # "normal"  | "abnormal"
    sediment_test: Optional[str] = None        # "clean"   | "dirty"
    mbrt: Optional[float] = None
    raw_milk_temp: Optional[float] = None
    quantity: Optional[float] = None


@dataclass
class DecisionResult:
    decision: str = "accept"            # "accept" | "reject" | "partial"
    reasons: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    fraud_risk: str = "low"             # "low" | "medium" | "high"
    parameter_flags: Dict = field(default_factory=dict)
    missing_critical: List[str] = field(default_factory=list)


# ── AI Laboratory Thresholds ──────────────────────────────────────────────────

DEFAULT_THRESHOLDS = {
    "fat_min": 3.2,
    "fat_max": 3.5,
    "snf_min": 8.3,
    "snf_max": 8.5,
    "ph_min": 6.5,
    "ph_max": 6.8,
    "acidity_min": 0.10,
    "acidity_max": 0.15,
    "temp_acceptable": 15.0,
    "sg_min": 1.028,
    "sg_max": 1.032,
    "mbrt_check": 120.0,
    "raw_milk_temp_min": 25.0,
    "raw_milk_temp_max": 37.0,
    "cob_pass": "negative",
    "alcohol_pass": "negative",
    "organoleptic_pass": "normal",
    "sediment_pass": "clean"
}


class DecisionEngine:
    def __init__(self, thresholds: Optional[dict] = None):
        self.t = {**DEFAULT_THRESHOLDS, **(thresholds or {})}

    def _is_pass(self, value: any, key: str) -> bool:
        """Dynamically check if a qualitative value matches the accept keyword."""
        if value is None: return False
        return str(value).lower().strip() == str(self.t.get(key, "")).lower().strip()

    def evaluate(self, sample: MilkSample) -> DecisionResult:
        result = DecisionResult()
        critical_failures = []
        minor_warnings = []
        missing_fields = []
        flags = {}

        # 1. FAT (3.2 - 3.5)
        if sample.fat is not None:
            if not (self.t["fat_min"] <= sample.fat <= self.t["fat_max"]):
                critical_failures.append(f"Possible Adulteration (Fat {sample.fat:.2f}%)")
                flags["fat"] = "fail"
            else:
                flags["fat"] = "pass"
        else:
            missing_fields.append("Fat (%)")
            flags["fat"] = "missing"

        # 2. SNF (8.3 - 8.5)
        if sample.snf is not None:
            if not (self.t["snf_min"] <= sample.snf <= self.t["snf_max"]):
                critical_failures.append(f"Added water (SNF {sample.snf:.2f}%)")
                flags["snf"] = "fail"
            else:
                flags["snf"] = "pass"
        else:
            missing_fields.append("SNF (%)")
            flags["snf"] = "missing"

        # 3. pH (6.5 - 6.8)
        if sample.ph is not None:
            if not (self.t["ph_min"] <= sample.ph <= self.t["ph_max"]):
                critical_failures.append(f"Spoilage (pH {sample.ph:.2f})")
                flags["ph"] = "fail"
            else:
                flags["ph"] = "pass"
        else:
            missing_fields.append("pH")
            flags["ph"] = "missing"

        # 4. Acidity (0.10 - 0.15)
        if sample.acidity is not None:
            if not (self.t["acidity_min"] <= sample.acidity <= self.t["acidity_max"]):
                critical_failures.append(f"Souring (Acidity {sample.acidity:.3f}%)")
                flags["acidity"] = "fail"
            else:
                flags["acidity"] = "pass"
        else:
            missing_fields.append("Acidity")
            flags["acidity"] = "missing"

        # 5. Temperature (<= 15)
        if sample.temperature is not None:
            if sample.temperature > self.t["temp_acceptable"]:
                critical_failures.append(f"Bacterial growth risk ({sample.temperature:.1f}°C)")
                flags["temperature"] = "fail"
            else:
                flags["temperature"] = "pass"
        else:
            minor_warnings.append("Temperature vector missing")
            flags["temperature"] = "missing"

        # 6. Specific Gravity (1.028 - 1.032)
        if sample.specific_gravity is not None:
            if not (self.t["sg_min"] <= sample.specific_gravity <= self.t["sg_max"]):
                critical_failures.append(f"Added water (Density {sample.specific_gravity:.4f})")
                flags["specific_gravity"] = "fail"
            else:
                flags["specific_gravity"] = "pass"
        else:
            minor_warnings.append("Specific Gravity missing")
            flags["specific_gravity"] = "missing"

        # 7. MBRT (> 120 mins)
        if sample.mbrt is not None:
            mbrt_limit = self.t.get("mbrt_check", self.t.get("mbrt_min", 120.0))
            if sample.mbrt < mbrt_limit:
                critical_failures.append(f"Poor quality (MBRT {sample.mbrt:.0f}m)")
                flags["mbrt"] = "fail"
            else:
                flags["mbrt"] = "pass"
        else:
            missing_fields.append("MBRT")
            flags["mbrt"] = "missing"

        # 8. COB Test
        if sample.cob_test is not None:
            if not self._is_pass(sample.cob_test, "cob_pass"):
                critical_failures.append(f"COB Test: {sample.cob_test}")
                flags["cob_test"] = "fail"
            else:
                flags["cob_test"] = "pass"
        else:
            missing_fields.append("COB Test")
            flags["cob_test"] = "missing"

        # 9. Alcohol Test
        if sample.alcohol_test is not None:
            if not self._is_pass(sample.alcohol_test, "alcohol_pass"):
                critical_failures.append(f"Alcohol Test: {sample.alcohol_test}")
                flags["alcohol_test"] = "fail"
            else:
                flags["alcohol_test"] = "pass"
        else:
            minor_warnings.append("Alcohol Test missing")
            flags["alcohol_test"] = "missing"

        # 10. Organoleptic
        if sample.organoleptic is not None:
            if not self._is_pass(sample.organoleptic, "organoleptic_pass"):
                critical_failures.append(f"Organoleptic: {sample.organoleptic}")
                flags["organoleptic"] = "fail"
            else:
                flags["organoleptic"] = "pass"
        else:
            flags["organoleptic"] = "missing"

        # 11. Sediment Test
        if sample.sediment_test is not None:
            if not self._is_pass(sample.sediment_test, "sediment_pass"):
                critical_failures.append(f"Sediment Test: {sample.sediment_test}")
                flags["sediment_test"] = "fail"
            else:
                flags["sediment_test"] = "pass"
        else:
            flags["sediment_test"] = "missing"

        # 12. Raw Milk Temperature (25 - 37)
        if sample.raw_milk_temp is not None:
            if not (self.t["raw_milk_temp_min"] <= sample.raw_milk_temp <= self.t["raw_milk_temp_max"]):
                critical_failures.append(f"Reject (Raw Temp {sample.raw_milk_temp:.1f}°C)")
                flags["raw_milk_temp"] = "fail"
            else:
                flags["raw_milk_temp"] = "pass"
        else:
            flags["raw_milk_temp"] = "missing"

        # ── Final Decision Logic ─────────────────────────────────────
        result.parameter_flags = flags
        result.missing_critical = missing_fields
        result.warnings = minor_warnings + [f"{m} value missing" for m in missing_fields]
        
        # 1. Reject has highest priority
        if critical_failures:
            result.decision = "reject"
            result.reasons = critical_failures
        # 2. If no critical failures but ANY mandatory fields are missing → Partial
        elif missing_fields:
            result.decision = "partial"
            result.reasons = [f"Partial Analysis: Mandatory vectors missing ({', '.join(missing_fields)})"]
        # 3. Otherwise Accept
        else:
            result.decision = "accept"
            result.reasons = ["All detected parameters within nominal range"]

        result.fraud_risk = self._assess_fraud_risk(sample, flags, len(critical_failures))
        return result

    def _assess_fraud_risk(self, sample, flags, crit_count) -> str:
        score = 0
        if crit_count >= 2: score += 3
        if flags.get("fat") == "fail" and flags.get("snf") == "fail": score += 3
        if flags.get("specific_gravity") == "fail" and flags.get("snf") == "fail": score += 2
        if flags.get("cob_test") == "fail": score += 4
        
        if score >= 5: return "high"
        if score >= 2: return "medium"
        return "low"

def get_engine_with_db_settings(db_settings: dict | None = None) -> DecisionEngine:
    if not db_settings: return DecisionEngine()
    parsed = {}
    for k, v in db_settings.items():
        try:
            parsed[k] = float(v)
        except (ValueError, TypeError):
            parsed[k] = v
    return DecisionEngine(thresholds=parsed)
