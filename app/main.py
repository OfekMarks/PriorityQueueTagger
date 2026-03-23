"""
FastAPI application entry point for the Priority Queue Tagger.

Run with:
    uvicorn app.main:app --reload
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.api.routes import router as api_router
from app.models.database import init_db

app = FastAPI(title="Priority Queue Tagger")

# --- Static files & templates ---------------------------------------------
STATIC_DIR = Path(__file__).resolve().parent / "static"
TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# --- Startup ---------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    """Initialize the database on first run."""
    init_db()


# --- API routes ------------------------------------------------------------
app.include_router(api_router)


# --- Serve the SPA ---------------------------------------------------------
@app.get("/")
def index():
    """Serve the main HTML page."""
    return FileResponse(str(TEMPLATES_DIR / "index.html"))
