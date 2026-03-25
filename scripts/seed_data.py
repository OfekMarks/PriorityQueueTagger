"""
Seed the database with sample events and GeoJSON entities around Israel.

Usage:
    python scripts/seed_data.py
"""

import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Ensure the project root is on sys.path so we can import the app package.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.models.database import init_db, insert_event, insert_entity  # noqa: E402


def _point(lon: float, lat: float) -> dict:
    """Create a GeoJSON Point."""
    return {"type": "Point", "coordinates": [lon, lat]}


def _feature(geometry: dict, properties: dict) -> dict:
    """Create a GeoJSON Feature."""
    return {"type": "Feature", "geometry": geometry, "properties": properties}


def _polygon_circle(
    lon: float, lat: float, radius_deg: float = 0.005, n: int = 16
) -> dict:
    """Approximate a circular GeoJSON Polygon (for demo purposes)."""
    import math

    coords = []
    for i in range(n):
        angle = 2 * math.pi * i / n
        coords.append(
            [lon + radius_deg * math.cos(angle), lat + radius_deg * math.sin(angle)]
        )
    coords.append(coords[0])  # close the ring
    return {"type": "Polygon", "coordinates": [coords]}


SAMPLE_EVENTS = [
    {
        "name": "Tel Aviv Port Area",
        "location": _point(34.7725, 32.0971),
        "entities": [
            _feature(
                _point(34.7710, 32.0965), {"name": "Warehouse A", "type": "building"}
            ),
            _feature(
                _point(34.7740, 32.0978), {"name": "Crane 1", "type": "equipment"}
            ),
            _feature(
                _polygon_circle(34.7725, 32.0971, 0.003),
                {"name": "Loading Zone", "type": "area"},
            ),
        ],
    },
    {
        "name": "Jerusalem Old City Gate",
        "location": _point(35.2316, 31.7767),
        "entities": [
            _feature(
                _point(35.2310, 31.7770), {"name": "Guard Post", "type": "structure"}
            ),
            _feature(
                _point(35.2322, 31.7764),
                {"name": "Vehicle Barrier", "type": "equipment"},
            ),
        ],
    },
    {
        "name": "Haifa Industrial Zone",
        "location": _point(35.0120, 32.7940),
        "entities": [
            _feature(
                _point(35.0105, 32.7935), {"name": "Factory B", "type": "building"}
            ),
            _feature(
                _point(35.0130, 32.7945),
                {"name": "Storage Tank 3", "type": "infrastructure"},
            ),
            _feature(
                _polygon_circle(35.0120, 32.7940, 0.004),
                {"name": "Restricted Perimeter", "type": "area"},
            ),
            _feature(
                _point(35.0115, 32.7950), {"name": "Control Tower", "type": "building"}
            ),
        ],
    },
    {
        "name": "Be'er Sheva Intersection",
        "location": _point(34.7913, 31.2518),
        "entities": [
            _feature(
                _point(34.7905, 31.2520),
                {"name": "Checkpoint Alpha", "type": "structure"},
            ),
            _feature(
                _polygon_circle(34.7913, 31.2518, 0.002),
                {"name": "Observation Zone", "type": "area"},
            ),
        ],
    },
    {
        "name": "Eilat Shore Facility",
        "location": _point(34.9514, 29.5577),
        "entities": [
            _feature(
                _point(34.9510, 29.5575), {"name": "Dock 1", "type": "infrastructure"}
            ),
            _feature(
                _point(34.9520, 29.5580), {"name": "Radar Station", "type": "equipment"}
            ),
            _feature(
                _point(34.9508, 29.5583),
                {"name": "Patrol Boat Mooring", "type": "infrastructure"},
            ),
        ],
    },
]


def seed() -> None:
    """Populate the database with sample data."""
    init_db()
    for event_data in SAMPLE_EVENTS:
        event_id = insert_event(event_data["name"], event_data["location"])
        for entity_geojson in event_data["entities"]:
            insert_entity(event_id, entity_geojson)
        print(
            f"  Created event '{event_data['name']}' (id={event_id}) "
            f"with {len(event_data['entities'])} entities"
        )
    print(f"\nSeeded {len(SAMPLE_EVENTS)} events.")


if __name__ == "__main__":
    seed()
