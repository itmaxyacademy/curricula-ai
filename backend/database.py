import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

load_dotenv()

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "curricula_ai")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # If explicit MySQL user is set and DB_TYPE is mysql, construct MySQL URL
    if os.getenv("DB_TYPE") == "mysql":
        DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    else:
        DATABASE_URL = "sqlite:///./course_generator.db"

from sqlalchemy.pool import NullPool

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False, "timeout": 60},
        poolclass=NullPool
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=60000")
        cursor.close()
else:
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
        with engine.connect() as conn:
            pass
    except Exception as e:
        SQLITE_URL = "sqlite:///./course_generator.db"
        engine = create_engine(
            SQLITE_URL,
            connect_args={"check_same_thread": False, "timeout": 60},
            poolclass=NullPool
        )

        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=60000")
            cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db_migrations():
    """Ensure newly added columns exist in legacy SQLite databases without failing."""
    try:
        with engine.connect() as conn:
            # Check sessions table columns
            if DATABASE_URL.startswith("sqlite"):
                cols = [row[1] for row in conn.execute(text("PRAGMA table_info(sessions)")).fetchall()]
                if cols and "created_at" not in cols:
                    conn.execute(text("ALTER TABLE sessions ADD COLUMN created_at VARCHAR(32)"))
                    conn.commit()
                if cols and "all_suggested_tags" not in cols:
                    conn.execute(text("ALTER TABLE sessions ADD COLUMN all_suggested_tags TEXT DEFAULT '[]'"))
                    conn.commit()
    except Exception as e:
        print(f"[DB Auto-Migration Notice] {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
