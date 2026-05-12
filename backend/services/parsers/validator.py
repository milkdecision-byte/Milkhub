import pandas as pd
import re
from typing import Tuple, List, Dict

def normalize_string(s: str) -> str:
    """Removes spaces, symbols, brackets, and lowercases the string."""
    if not s: return ""
    # Remove everything except alphanumeric
    return re.sub(r'[^a-z0-9]', '', str(s).lower())

# Canonical mapping for normalized keys
INTELLIGENT_MAP: Dict[str, str] = {
    # Fat
    "fat": "fat", "fatpercent": "fat", "fatpercentage": "fat", "fatpct": "fat",
    # SNF
    "snf": "snf", "snfpercent": "snf", "snfpercentage": "snf", "snfpct": "snf", "snfvalue": "snf",
    # pH
    "ph": "ph", "phvalue": "ph",
    # Acidity
    "acidity": "acidity", "acidityla": "acidity", "aciditypercent": "acidity", "aciditypct": "acidity",
    # Temperature
    "temperature": "temperature", "temp": "temperature", "temperaturec": "temperature", "tempc": "temperature",
    # Specific Gravity
    "specificgravity": "specific_gravity", "sg": "specific_gravity", "gravity": "specific_gravity", "spgravity": "specific_gravity",
    # COB
    "cob": "cob_test", "cobtest": "cob_test",
    # Alcohol
    "alcohol": "alcohol_test", "alcoholtest": "alcohol_test",
    # Organoleptic
    "organoleptic": "organoleptic", "organoleptictest": "organoleptic",
    # Sediment
    "sediment": "sediment_test", "sedimenttest": "sediment_test",
    # MBRT
    "mbrt": "mbrt", "mbrtmin": "mbrt", "mbrth": "mbrt",
    # Raw Milk Temp
    "rawmilktemperature": "raw_milk_temp", "rawmilktemp": "raw_milk_temp", "rawtemp": "raw_milk_temp", "milktemp": "raw_milk_temp",
    # Quantity
    "quantity": "quantity", "qty": "quantity", "volume": "quantity", "yield": "quantity",
    # Identity
    "farmername": "farmer_name", "name": "farmer_name", "suppliername": "farmer_name", "farmer": "farmer_name",
    "farmercode": "farmer_code", "code": "farmer_code", "suppliercode": "farmer_code", "registryid": "farmer_code",
    # Context
    "date": "date", "timestamp": "date",
    "shift": "shift", "session": "shift", "node": "shift"
}

NUMERIC_FIELDS = {
    "fat", "snf", "ph", "acidity", "temperature",
    "specific_gravity", "mbrt", "raw_milk_temp", "quantity",
}

CATEGORICAL_FIELDS = {
    "cob_test": ("negative", "positive"),
    "alcohol_test": ("negative", "positive"),
    "organoleptic": ("normal", "abnormal"),
    "sediment_test": ("clean", "dirty"),
}

# AI-style nominal defaults for missing vectors
DEFAULT_VALUES = {
    "fat": 3.5,
    "snf": 8.5,
    "ph": 6.6,
    "acidity": 0.14,
    "temperature": 4.0,
    "specific_gravity": 1.028,
    "mbrt": 300,
    "cob_test": "negative",
    "alcohol_test": "negative",
    "organoleptic": "normal",
    "sediment_test": "clean",
    "raw_milk_temp": 4.0,
    "quantity": 1.0,
}

# The user explicitly asked for Fat, SNF, and pH as primary, 
# but also said we should not reject if missing.
# We will define what we EXPECT but won't block.
ALL_EXPECTED = list(INTELLIGENT_MAP.values())

def _parse_shift(value) -> str:
    v = str(value or "").strip().lower()
    if any(x in v for x in ("eve", "e", "pm")):
        return "evening"
    return "morning"

def validate_and_normalize(df: pd.DataFrame) -> Tuple[List[Dict], List[str], List[str], List[str]]:
    """
    Returns (rows, errors, detected_fields, missing_fields)
    """
    errors: List[str] = []
    
    # 1. Intelligent Header Mapping
    original_cols = df.columns.tolist()
    rename_map = {}
    detected_canonical = set()
    
    for col in original_cols:
        norm = normalize_string(col)
        canonical = INTELLIGENT_MAP.get(norm)
        if canonical:
            rename_map[col] = canonical
            detected_canonical.add(canonical)
            
    df.rename(columns=rename_map, inplace=True)
    
    # Identify missing fields (excluding ID fields)
    expected_data_fields = set(NUMERIC_FIELDS) | set(CATEGORICAL_FIELDS.keys())
    missing_fields = sorted(list(expected_data_fields - detected_canonical))
    detected_fields = sorted(list(detected_canonical & expected_data_fields))

    rows: List[Dict] = []
    for idx, row in df.iterrows():
        row_num = idx + 2
        record: dict = {}

        # Parse Numerics
        for field in NUMERIC_FIELDS:
            raw = row.get(field)
            if pd.isna(raw) or raw is None or str(raw).strip() == "":
                record[field] = None # Will be handled by decision engine as missing
            else:
                try:
                    record[field] = float(str(raw).strip())
                except ValueError:
                    errors.append(f"Row {row_num}: '{field}' value '{raw}' is not numeric. Imputing...")
                    record[field] = None

        # Parse Categoricals
        for field, (alt1, alt2) in CATEGORICAL_FIELDS.items():
            if field in df.columns:
                raw = str(row.get(field) or "").strip().lower()
                # If it's Pass/Fail or Positive/Negative etc
                if any(x in raw for x in ("pos", "fail", "dirty", "abnormal")):
                    record[field] = alt2
                else:
                    record[field] = alt1
            else:
                record[field] = None # Missing

        # Core Metadata
        record["farmer_name"] = str(row.get("farmer_name", "Unknown")).strip() or "Unknown"
        record["farmer_code"] = str(row.get("farmer_code", "")).strip()
        record["date"] = str(row.get("date", "")).strip()
        record["shift"] = _parse_shift(row.get("shift", "morning"))

        rows.append(record)

    return rows, errors, detected_fields, missing_fields
