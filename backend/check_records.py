from app import create_app
from models.database import db, MilkRecord

app = create_app()
with app.app_context():
    records = MilkRecord.query.all()
    for r in records[:5]:
        print(f"record id: {r.id}, farmer_id: {r.farmer_id}, farmer_code: {r.farmer_code}, farmer_name: {r.farmer_name}")
