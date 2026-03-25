"""
FastAPI application entry point for the Priority Queue Tagger.

Run with:
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.models.database import init_db

app = FastAPI(title="Priority Queue Tagger")

# --- CORS ------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Startup ---------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    """Initialize the database on first run."""
    init_db()


# --- API routes ------------------------------------------------------------
app.include_router(api_router)
