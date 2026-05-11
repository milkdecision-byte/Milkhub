from app import create_app
from models.database import db, UploadBatch

app = create_app()
with app.app_context():
    batches = UploadBatch.query.all()
    for b in batches:
        print(b.batch_id, b.total_records)
