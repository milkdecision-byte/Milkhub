"""
DB Migration Script — Add milk_type column to upload_batches
Run once: python migrate_upload_batches.py
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
    "ALTER TABLE upload_batches ADD COLUMN IF NOT EXISTS milk_type VARCHAR(20) DEFAULT 'cow'",
]

with app.app_context():
    for sql in MIGRATIONS:
        try:
            db.session.execute(db.text(sql))
            print(f"OK: {sql}...")
        except Exception as e:
            print(f"SKIP ({e}): {sql}...")
    db.session.commit()
    print("\nMigration complete.")
