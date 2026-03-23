"""
REST API routes for the Priority Queue Tagger.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.database import (
    get_all_events,
    get_event_with_entities,
    add_comparison,
    get_all_comparisons,
)
from app.engine.comparison import get_next_pair
from app.engine.tiles import get_tile_config

router = APIRouter(prefix="/api")


# ---- Request / Response models --------------------------------------------


class CompareRequest(BaseModel):
    winner_id: int
    loser_id: int


# ---- Endpoints ------------------------------------------------------------


@router.get("/tiles")
def tiles_config():
    """Return the active tile provider configuration."""
    return get_tile_config()


@router.get("/events")
def list_events():
    """List all events with entity counts."""
    return get_all_events()


@router.get("/events/{event_id}")
def get_event(event_id: int):
    """Get a single event with all its GeoJSON entities."""
    event = get_event_with_entities(event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/pair")
def next_pair():
    """Return the next pair of events to compare, with full entity data."""
    pair = get_next_pair()
    if pair is None:
        return {"done": True, "message": "All pairs have been compared!"}

    event_a = get_event_with_entities(pair[0])
    event_b = get_event_with_entities(pair[1])
    return {"done": False, "event_a": event_a, "event_b": event_b}


@router.post("/compare")
def submit_comparison(body: CompareRequest):
    """Store a pairwise comparison (winner > loser)."""
    if body.winner_id == body.loser_id:
        raise HTTPException(status_code=400, detail="winner and loser must differ")

    # Validate that both events exist
    if get_event_with_entities(body.winner_id) is None:
        raise HTTPException(status_code=404, detail=f"Event {body.winner_id} not found")
    if get_event_with_entities(body.loser_id) is None:
        raise HTTPException(status_code=404, detail=f"Event {body.loser_id} not found")

    comp_id = add_comparison(body.winner_id, body.loser_id)
    return {"id": comp_id, "winner_id": body.winner_id, "loser_id": body.loser_id}


@router.get("/comparisons")
def list_comparisons():
    """Return all stored comparisons (for debugging / export)."""
    return get_all_comparisons()
