"""
DB Migration Script — Add ML columns to milk_records
Run once: python migrate_ml_columns.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from models.database import db

app = create_app()

MIGRATIONS = [
    "ALTER TABLE milk_records ADD COLUMN IF NOT EXISTS milk_type VARCHAR(20) DEFAULT 'cow'",
    "ALTER TABLE milk_records ADD COLUMN IF NOT EXISTS model_version VARCHAR(20)",
    "ALTER TABLE milk_records ADD COLUMN IF NOT EXISTS ml_score NUMERIC(5,4)",
    "ALTER TABLE milk_records ADD COLUMN IF NOT EXISTS anomaly_score NUMERIC(5,4)",
    "ALTER TABLE milk_records ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,4)",
]

with app.app_context():
    for sql in MIGRATIONS:
        try:
            db.session.execute(db.text(sql))
            print(f"OK: {sql[:60]}...")
        except Exception as e:
            print(f"SKIP ({e}): {sql[:60]}...")
    db.session.commit()
    print("\nMigration complete.")
