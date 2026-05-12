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
    "snf_min": 8.3,
    "ph_min": 6.5,
    "ph_max": 6.8,
    "acidity_max": 0.15,
    "temp_acceptable": 15.0,
    "sg_min": 1.026,
    "mbrt_min": 4.0,
}


class DecisionEngine:
    def __init__(self, thresholds: Optional[dict] = None):
        self.t = {**DEFAULT_THRESHOLDS, **(thresholds or {})}

    def evaluate(self, sample: MilkSample) -> DecisionResult:
        result = DecisionResult()
        critical_failures = []
        minor_warnings = []
        missing_fields = []
        flags = {}

        # 1. FAT
        if sample.fat is not None:
            if sample.fat < self.t["fat_min"]:
                critical_failures.append(f"Fat below limit ({sample.fat:.2f}%)")
                flags["fat"] = "fail"
            else:
                flags["fat"] = "pass"
        else:
            missing_fields.append("Fat (%)")
            flags["fat"] = "missing"

        # 2. SNF
        if sample.snf is not None:
            if sample.snf < self.t["snf_min"]:
                critical_failures.append(f"SNF below limit ({sample.snf:.2f}%)")
                flags["snf"] = "fail"
            else:
                flags["snf"] = "pass"
        else:
            missing_fields.append("SNF (%)")
            flags["snf"] = "missing"

        # 3. pH
        if sample.ph is not None:
            if not (self.t["ph_min"] <= sample.ph <= self.t["ph_max"]):
                critical_failures.append(f"Abnormal pH ({sample.ph:.2f})")
                flags["ph"] = "fail"
            else:
                flags["ph"] = "pass"
        else:
            missing_fields.append("pH")
            flags["ph"] = "missing"

        # 4. Acidity
        if sample.acidity is not None:
            if sample.acidity > self.t["acidity_max"]:
                critical_failures.append(f"High Acidity ({sample.acidity:.3f}%)")
                flags["acidity"] = "fail"
            else:
                flags["acidity"] = "pass"
        else:
            minor_warnings.append("Acidity vector missing")
            flags["acidity"] = "missing"

        # 5. Temperature
        if sample.temperature is not None:
            if sample.temperature > self.t["temp_acceptable"]:
                critical_failures.append(f"High Temperature ({sample.temperature:.1f}°C)")
                flags["temperature"] = "fail"
            else:
                flags["temperature"] = "pass"
        else:
            minor_warnings.append("Temperature vector missing")
            flags["temperature"] = "missing"

        # 6. Specific Gravity
        if sample.specific_gravity is not None:
            if sample.specific_gravity < self.t["sg_min"]:
                critical_failures.append(f"Low Density ({sample.specific_gravity:.4f})")
                flags["specific_gravity"] = "fail"
            else:
                flags["specific_gravity"] = "pass"
        else:
            minor_warnings.append("Specific Gravity missing")
            flags["specific_gravity"] = "missing"

        # 7. MBRT
        if sample.mbrt is not None:
            if sample.mbrt < self.t["mbrt_min"]:
                minor_warnings.append(f"Low MBRT ({sample.mbrt:.1f}h)")
                flags["mbrt"] = "warning"
            else:
                flags["mbrt"] = "pass"
        else:
            minor_warnings.append("MBRT missing")
            flags["mbrt"] = "missing"

        # 8. COB Test
        if sample.cob_test is not None:
            if str(sample.cob_test).lower().strip() == "positive":
                critical_failures.append("COB Positive")
                flags["cob_test"] = "fail"
            else:
                flags["cob_test"] = "pass"
        else:
            missing_fields.append("COB Test")
            flags["cob_test"] = "missing"

        # 9. Alcohol Test
        if sample.alcohol_test is not None:
            if any(x in str(sample.alcohol_test).lower() for x in ("fail", "pos")):
                critical_failures.append("Alcohol Test FAIL")
                flags["alcohol_test"] = "fail"
            else:
                flags["alcohol_test"] = "pass"
        else:
            minor_warnings.append("Alcohol Test missing")
            flags["alcohol_test"] = "missing"

        # 10. Organoleptic
        if sample.organoleptic is not None:
            if str(sample.organoleptic).lower().strip() == "abnormal":
                minor_warnings.append("Organoleptic Abnormal")
                flags["organoleptic"] = "warning"
            else:
                flags["organoleptic"] = "pass"
        else:
            flags["organoleptic"] = "missing"

        # ── Final Decision Logic ─────────────────────────────────────
        result.parameter_flags = flags
        result.missing_critical = missing_fields
        result.warnings = minor_warnings + [f"{m} value missing" for m in missing_fields]
        
        # 1. Reject has highest priority
        if critical_failures:
            result.decision = "reject"
            result.reasons = critical_failures
        # 2. If no critical failures but many missing fields → Partial
        elif len(missing_fields) >= 3:
            result.decision = "partial"
            result.reasons = ["Partial Analysis: Insufficient molecular vectors for full certification"]
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
        try: parsed[k] = float(v)
        except: pass
    return DecisionEngine(thresholds=parsed)
