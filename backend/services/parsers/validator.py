import pandas as pd
from typing import Tuple, List, Dict

COLUMN_ALIASES: dict[str, str] = {
    "fat": "fat", "fat %": "fat", "fat_pct": "fat", "fat(%)": "fat", "fat percentage": "fat",
    "snf": "snf", "snf %": "snf", "snf_pct": "snf", "snf(%)": "snf", "snf value": "snf",
    "ph": "ph", "ph value": "ph",
    "acidity": "acidity", "acidity %": "acidity", "acidity_pct": "acidity",
    "temperature": "temperature", "temp": "temperature", "temp(°c)": "temperature", "temperature(°c)": "temperature",
    "specific_gravity": "specific_gravity", "sg": "specific_gravity", "specific gravity": "specific_gravity", "sp gravity": "specific_gravity", "gravity": "specific_gravity",
    "cob_test": "cob_test", "cob test": "cob_test", "cob": "cob_test",
    "alcohol_test": "alcohol_test", "alcohol test": "alcohol_test", "alcohol": "alcohol_test",
    "organoleptic": "organoleptic", "organoleptic test": "organoleptic",
    "sediment_test": "sediment_test", "sediment test": "sediment_test", "sediment": "sediment_test",
    "mbrt": "mbrt", "mbrt (h)": "mbrt", "mbrt(h)": "mbrt",
    "raw_milk_temp": "raw_milk_temp", "raw milk temp": "raw_milk_temp", "raw milk temperature": "raw_milk_temp", "raw_temp": "raw_milk_temp",
    "quantity": "quantity", "qty": "quantity", "quantity (l)": "quantity", "volume": "quantity",
    "farmer_name": "farmer_name", "farmer name": "farmer_name", "name": "farmer_name", "supplier name": "farmer_name",
    "farmer_code": "farmer_code", "farmer code": "farmer_code", "code": "farmer_code", "supplier code": "farmer_code",
    "date": "date", "shift": "shift",
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

REQUIRED_COLUMNS = {
    "fat", "snf", "ph"
}

# Fields that will get nominal defaults if missing
DEFAULT_VALUES = {
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

def _parse_shift(value) -> str:
    v = str(value or "").strip().lower()
    if "eve" in v or v in ("e", "pm"):
        return "evening"
    return "morning"

def validate_and_normalize(df: pd.DataFrame) -> Tuple[List[Dict], List[str]]:
    errors: List[str] = []

    # Normalise column names
    df.columns = [str(c).strip().lower() for c in df.columns]
    rename_map = {}
    for col in df.columns:
        canonical = COLUMN_ALIASES.get(col)
        if canonical:
            rename_map[col] = canonical
    df.rename(columns=rename_map, inplace=True)

    # Validate Mandatory Columns
    missing_cols = REQUIRED_COLUMNS - set(df.columns)
    if missing_cols:
        return [], [f"Missing Required Parameters: {', '.join(missing_cols)}"]

    rows: List[Dict] = []
    for idx, row in df.iterrows():
        row_num = idx + 2
        record: dict = {}

        for field in NUMERIC_FIELDS:
            raw = row.get(field)
            if pd.isna(raw) or raw is None or str(raw).strip() == "":
                record[field] = DEFAULT_VALUES.get(field)
            else:
                try:
                    record[field] = float(str(raw).strip())
                except ValueError:
                    errors.append(f"Row {row_num}: '{field}' value '{raw}' is not numeric. Using default.")
                    record[field] = DEFAULT_VALUES.get(field)

        for field, (alt1, alt2) in CATEGORICAL_FIELDS.items():
            default = DEFAULT_VALUES.get(field)
            raw = str(row.get(field, default) or default).strip().lower()
            record[field] = alt2 if raw == alt2 else alt1

        record["farmer_name"] = str(row.get("farmer_name", "Unknown")).strip() or "Unknown"
        record["farmer_code"] = str(row.get("farmer_code", "")).strip()
        record["date"] = str(row.get("date", "")).strip()
        record["shift"] = _parse_shift(row.get("shift", "morning"))

        rows.append(record)

    return rows, errors
