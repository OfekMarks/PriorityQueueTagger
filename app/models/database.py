"""
SQLite database layer for the Priority Queue Tagger.

Tables:
  - events: groups of entities at a location
  - entities: GeoJSON features belonging to an event
  - comparisons: pairwise orderings (winner > loser)
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Optional

DB_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DB_PATH = DB_DIR / "tagger.db"


def get_connection() -> sqlite3.Connection:
    """Return a connection to the SQLite database, creating it if needed."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Create tables if they don't already exist."""
    conn = get_connection()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS events (
                id    INTEGER PRIMARY KEY AUTOINCREMENT,
                name  TEXT    NOT NULL,
                location TEXT NOT NULL  -- GeoJSON Point as JSON text
            );

            CREATE TABLE IF NOT EXISTS entities (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                geojson  TEXT    NOT NULL,  -- Full GeoJSON Feature
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS comparisons (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                winner_id INTEGER NOT NULL,
                loser_id  INTEGER NOT NULL,
                timestamp TEXT    NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (winner_id) REFERENCES events(id),
                FOREIGN KEY (loser_id)  REFERENCES events(id)
            );
            CREATE TABLE IF NOT EXISTS pair_locks (
                event_a    INTEGER NOT NULL,
                event_b    INTEGER NOT NULL,
                expires_at TEXT    NOT NULL,
                PRIMARY KEY (event_a, event_b),
                FOREIGN KEY (event_a) REFERENCES events(id),
                FOREIGN KEY (event_b) REFERENCES events(id)
            );
        """
        )
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Event queries
# ---------------------------------------------------------------------------


def get_all_events() -> list[dict[str, Any]]:
    """Return all events with their entity counts."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT e.id, e.name, e.location,
                   COUNT(ent.id) AS entity_count
            FROM events e
            LEFT JOIN entities ent ON ent.event_id = e.id
            GROUP BY e.id
            ORDER BY e.id
        """
        ).fetchall()
        return [
            {
                "id": r["id"],
                "name": r["name"],
                "location": json.loads(r["location"]),
                "entity_count": r["entity_count"],
            }
            for r in rows
        ]
    finally:
        conn.close()


def get_event_with_entities(event_id: int) -> Optional[dict[str, Any]]:
    """Return a single event with all its GeoJSON entities."""
    conn = get_connection()
    try:
        event_row = conn.execute(
            "SELECT id, name, location FROM events WHERE id = ?", (event_id,)
        ).fetchone()
        if event_row is None:
            return None

        entity_rows = conn.execute(
            "SELECT id, geojson FROM entities WHERE event_id = ?", (event_id,)
        ).fetchall()

        return {
            "id": event_row["id"],
            "name": event_row["name"],
            "location": json.loads(event_row["location"]),
            "entities": [
                {"id": er["id"], "geojson": json.loads(er["geojson"])}
                for er in entity_rows
            ],
        }
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Comparison queries
# ---------------------------------------------------------------------------


def add_comparison(winner_id: int, loser_id: int) -> int:
    """Store a pairwise comparison. Returns the new comparison id."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO comparisons (winner_id, loser_id) VALUES (?, ?)",
            (winner_id, loser_id),
        )
        conn.commit()
        return cursor.lastrowid  # type: ignore[return-value]
    finally:
        conn.close()


def get_all_comparisons() -> list[dict[str, Any]]:
    """Return all stored comparisons."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT 
                c.id, 
                c.winner_id, w.name AS winner_name, 
                c.loser_id, l.name AS loser_name, 
                c.timestamp 
            FROM comparisons c
            JOIN events w ON c.winner_id = w.id
            JOIN events l ON c.loser_id = l.id
            ORDER BY c.id
            """
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_comparison_count_per_event() -> dict[int, int]:
    """Return {event_id: number_of_comparisons} for every event."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT event_id, SUM(cnt) as total FROM (
                SELECT winner_id AS event_id, COUNT(*) AS cnt FROM comparisons GROUP BY winner_id
                UNION ALL
                SELECT loser_id  AS event_id, COUNT(*) AS cnt FROM comparisons GROUP BY loser_id
            ) GROUP BY event_id
        """
        ).fetchall()
        return {r["event_id"]: r["total"] for r in rows}
    finally:
        conn.close()


def get_compared_pairs() -> set[frozenset[int]]:
    """Return all pairs that have already been compared."""
    conn = get_connection()
    try:
        rows = conn.execute("SELECT winner_id, loser_id FROM comparisons").fetchall()
        return {frozenset((r["winner_id"], r["loser_id"])) for r in rows}
    finally:
        conn.close()


def get_event_ids() -> list[int]:
    """Return all event IDs."""
    conn = get_connection()
    try:
        rows = conn.execute("SELECT id FROM events ORDER BY id").fetchall()
        return [r["id"] for r in rows]
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Pair Locking queries
# ---------------------------------------------------------------------------


def lock_pair(event_a: int, event_b: int, duration_minutes: int = 5) -> None:
    """Lock a pair to prevent it from being served to another user."""
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO pair_locks (event_a, event_b, expires_at)
            VALUES (?, ?, datetime('now', '+' || ? || ' minutes'))
            """,
            (event_a, event_b, duration_minutes),
        )
        conn.commit()
    finally:
        conn.close()


def unlock_pair(event_a: int, event_b: int) -> None:
    """Release a lock on a pair."""
    conn = get_connection()
    try:
        conn.execute(
            "DELETE FROM pair_locks WHERE (event_a = ? AND event_b = ?) OR (event_a = ? AND event_b = ?)",
            (event_a, event_b, event_b, event_a),
        )
        conn.commit()
    finally:
        conn.close()


def get_locked_pairs() -> set[frozenset[int]]:
    """Return all currently active locked pairs."""
    conn = get_connection()
    try:
        # Automatically clean up expired locks whenever this is called
        conn.execute("DELETE FROM pair_locks WHERE datetime('now') > expires_at")
        conn.commit()

        rows = conn.execute("SELECT event_a, event_b FROM pair_locks").fetchall()
        return {frozenset((r["event_a"], r["event_b"])) for r in rows}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Data insertion helpers (used by seed script)
# ---------------------------------------------------------------------------


def insert_event(name: str, location: dict) -> int:
    """Insert an event and return its id."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO events (name, location) VALUES (?, ?)",
            (name, json.dumps(location)),
        )
        conn.commit()
        return cursor.lastrowid  # type: ignore[return-value]
    finally:
        conn.close()


def insert_entity(event_id: int, geojson: dict) -> int:
    """Insert a GeoJSON entity for an event. Returns the entity id."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO entities (event_id, geojson) VALUES (?, ?)",
            (event_id, json.dumps(geojson)),
        )
        conn.commit()
        return cursor.lastrowid  # type: ignore[return-value]
    finally:
        conn.close()
