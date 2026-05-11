"""
Configuration module for Smart Milk Decision Tool System
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    # ── Flask ──────────────────────────────────────────────
    SECRET_KEY = os.getenv("SECRET_KEY", "milk-quality-secret-2024-xK9#mP")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"

    # ── Database (Supabase Postgres) ────────────────────────
    DB_URL = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
    if not DB_URL:
        raise ValueError(
            "CRITICAL: Missing required database environment variable (DATABASE_URL or SUPABASE_DB_URL)."
        )

    if DB_URL.startswith("postgresql://"):
        DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif DB_URL.startswith("postgres://"):
        DB_URL = DB_URL.replace("postgres://", "postgresql+psycopg2://", 1)

    if "sslmode=" not in DB_URL:
        separator = "&" if "?" in DB_URL else "?"
        DB_URL = f"{DB_URL}{separator}sslmode=require"

    SQLALCHEMY_DATABASE_URI = DB_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 280,
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    }

    DB_AUTO_CREATE = os.getenv("DB_AUTO_CREATE", "false").lower() == "true"

    # ── Supabase REST (optional) ──────────────────────────
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

    # ── JWT ────────────────────────────────────────────────
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "smartmilksecret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # ── File Upload ────────────────────────────────────────
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS = {"xlsx", "csv", "xls"}

    # ── ML Models ──────────────────────────────────────────
    ML_MODELS_PATH = os.path.join(os.path.dirname(__file__), "ml", "saved_models")

    # ── CORS ───────────────────────────────────────────────
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    # ── Pagination ─────────────────────────────────────────
    PAGE_SIZE = 50


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}

def get_config():
    env = os.getenv("FLASK_ENV", "development")
    return config_map.get(env, config_map["default"])
