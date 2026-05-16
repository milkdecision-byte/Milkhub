from app import create_app
from models.database import db, UploadBatch, MilkRecord

app = create_app()

with app.app_context():
    batches = UploadBatch.query.filter_by(upload_date='2026-05-11').all()
    print(f"Found {len(batches)} batches for 2026-05-11")
    for b in batches:
        print(f"Batch: {b.batch_id}, Date: {b.upload_date}")
        recs = MilkRecord.query.filter_by(batch_id=b.batch_id).all()
        print(f"  Total Records in DB for this batch: {len(recs)}")
        if recs:
            print(f"  Dates in records: {list(set([str(r.date) for r in recs]))}")
