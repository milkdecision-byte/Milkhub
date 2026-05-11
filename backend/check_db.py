from app import create_app
from models.database import db, Farmer, MilkRecord

app = create_app()
with app.app_context():
    print(f"Farmers count: {Farmer.query.count()}")
    print(f"Records count: {MilkRecord.query.count()}")
    for f in Farmer.query.all():
        print(f.id, f.farmer_code, f.full_name, f.total_submissions, f.avg_fat)
