import sys
from app import create_app
from models.database import db, Farmer, MilkRecord

app = create_app()
with app.app_context():
    print("--- Farmers ---")
    for f in Farmer.query.all():
        print(f.id, f.farmer_code, f.full_name, f.total_submissions, f.total_accepted, f.avg_fat, f.avg_snf, f.avg_quantity)
