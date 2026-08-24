from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import engine
from routes.auth import router as auth_router
from routes.courses import router as courses_router
from routes.lessons import router as lessons_router
from routes.documents import router as documents_router
from routes.exports import router as exports_router
from routes.history import router as history_router

app = FastAPI(title="Curricula AI - Course Generator API", version="1.0.0")

# Auto-migrate database columns & tables (cross-dialect: MySQL / SQLite)
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE sessions ADD COLUMN document_context TEXT"))
        conn.commit()
except Exception:
    pass

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE sessions ADD COLUMN document_filename VARCHAR(200)"))
        conn.commit()
except Exception:
    pass

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE sessions ADD COLUMN created_at VARCHAR(32)"))
        conn.commit()
except Exception:
    pass

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE sessions ADD COLUMN all_suggested_tags TEXT"))
        conn.commit()
except Exception:
    pass

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE lessons ADD COLUMN structure_key VARCHAR(64)"))
        conn.commit()
except Exception:
    pass

try:
    with engine.connect() as conn:
        dialect = engine.dialect.name
        if dialect == "mysql":
            result = conn.execute(text("SHOW TABLES LIKE 'pptx'"))
        else:  # SQLite
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='pptx'"))
        if not result.fetchone():
            if dialect == "mysql":
                conn.execute(text("""
                    CREATE TABLE pptx (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        lesson_id INT NOT NULL UNIQUE,
                        layouts_json TEXT NOT NULL,
                        selected_layout VARCHAR(20) DEFAULT 'layout_1',
                        brand_colors VARCHAR(50),
                        created_at VARCHAR(32),
                        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """))
            else:  # SQLite
                conn.execute(text("""
                    CREATE TABLE pptx (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        lesson_id INTEGER NOT NULL UNIQUE,
                        layouts_json TEXT NOT NULL,
                        selected_layout VARCHAR(20) DEFAULT 'layout_1',
                        brand_colors VARCHAR(50),
                        created_at VARCHAR(32),
                        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
                    )
                """))
            conn.commit()
except Exception as e:
    print(f"[Pptx Migration] {e}")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Modular Routers
app.include_router(auth_router)
app.include_router(courses_router)
app.include_router(lessons_router)
app.include_router(documents_router)
app.include_router(exports_router)
app.include_router(history_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to AI Course Generator API", "status": "online"}