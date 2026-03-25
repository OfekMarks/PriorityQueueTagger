"""
PostgreSQL database layer for the Priority Queue Tagger.
"""

from __future__ import annotations

import json
import os
from contextlib import contextmanager
from functools import wraps
from typing import Any, Iterator, Callable, TypeVar, cast

import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool

F = TypeVar("F", bound=Callable[..., Any])


class Database:
    """Singleton class that manages PostgreSQL connection pooling and query execution."""

    _instance: Database | None = None

    def __new__(cls) -> Database:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if not hasattr(self, "_pool"):
            self._pool = ThreadedConnectionPool(
                minconn=1, maxconn=6, dsn=os.getenv("DATABASE_URL")
            )

    @contextmanager
    def _get_cursor(self, commit: bool = False) -> Iterator[Any]:
        """Context manager to handle database connection pooling, cursor, and transactions."""
        conn = self._pool.getconn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                yield cursor
            if commit:
                conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._pool.putconn(conn)

    def execute_query(
        self, query: str, params: dict | None = None, commit: bool = False
    ) -> list[dict[str, Any]] | None:
        """Generic execution block that handles fetching and dict conversion automatically."""
        with self._get_cursor(commit=commit) as cursor:
            cursor.execute(query, params)

            if cursor.description:
                return [dict(r) for r in cursor.fetchall()]

            return None


def inject_database(func: F) -> F:
    """Decorator to inject the Database singleton instance."""

    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        if "data_base" not in kwargs:
            kwargs["data_base"] = Database()

        return func(*args, **kwargs)

    return cast(F, wrapper)


@inject_database
def init_db(*, data_base: Database) -> None:
    data_base.execute_query(
        """
        CREATE TABLE IF NOT EXISTS events (
            id       SERIAL PRIMARY KEY,
            name     TEXT NOT NULL,
            location JSONB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS entities (
            id       SERIAL PRIMARY KEY,
            event_id INTEGER NOT NULL,
            geojson  JSONB NOT NULL,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS comparisons (
            id        SERIAL PRIMARY KEY,
            winner_id INTEGER NOT NULL,
            loser_id  INTEGER NOT NULL,
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (winner_id) REFERENCES events(id),
            FOREIGN KEY (loser_id)  REFERENCES events(id)
        );

        CREATE TABLE IF NOT EXISTS pair_locks (
            event_a    INTEGER NOT NULL,
            event_b    INTEGER NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            PRIMARY KEY (event_a, event_b),
            FOREIGN KEY (event_a) REFERENCES events(id),
            FOREIGN KEY (event_b) REFERENCES events(id)
        );
        """,
        commit=True,
    )


@inject_database
def get_all_events(*, data_base: Database) -> list[dict[str, Any]]:
    return data_base.execute_query(
        """
        SELECT e.id, e.name, e.location,
               COUNT(ent.id) AS entity_count
        FROM events e
        LEFT JOIN entities ent ON ent.event_id = e.id
        GROUP BY e.id
        ORDER BY e.id
        """
    )


@inject_database
def get_event_with_entities(
    event_id: int, *, data_base: Database
) -> Optional[dict[str, Any]]:
    event_rows = data_base.execute_query(
        "SELECT id, name, location FROM events WHERE id = %(event_id)s",
        {"event_id": event_id},
    )
    if not event_rows:
        return None

    event_row = event_rows[0]

    entity_rows = data_base.execute_query(
        "SELECT id, geojson FROM entities WHERE event_id = %(event_id)s",
        {"event_id": event_id},
    )

    return {
        "id": event_row["id"],
        "name": event_row["name"],
        "location": event_row["location"],
        "entities": [{"id": er["id"], "geojson": er["geojson"]} for er in entity_rows],
    }


@inject_database
def add_comparison(winner_id: int, loser_id: int, *, data_base: Database) -> int:
    rows = data_base.execute_query(
        "INSERT INTO comparisons (winner_id, loser_id) VALUES (%(winner_id)s, %(loser_id)s) RETURNING id",
        {"winner_id": winner_id, "loser_id": loser_id},
        commit=True,
    )
    return rows[0]["id"]


@inject_database
def get_all_comparisons(*, data_base: Database) -> list[dict[str, Any]]:
    return data_base.execute_query(
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
    )


@inject_database
def get_comparison_count_per_event(*, data_base: Database) -> dict[int, int]:
    rows = data_base.execute_query(
        """
        SELECT event_id, SUM(cnt) as total FROM (
            SELECT winner_id AS event_id, COUNT(*) AS cnt FROM comparisons GROUP BY winner_id
            UNION ALL
            SELECT loser_id  AS event_id, COUNT(*) AS cnt FROM comparisons GROUP BY loser_id
        ) AS subquery GROUP BY event_id
        """
    )
    return {r["event_id"]: r["total"] for r in rows}


@inject_database
def get_compared_pairs(*, data_base: Database) -> set[frozenset[int]]:
    rows = data_base.execute_query("SELECT winner_id, loser_id FROM comparisons")
    return {frozenset((r["winner_id"], r["loser_id"])) for r in rows}


@inject_database
def get_event_ids(*, data_base: Database) -> list[int]:
    rows = data_base.execute_query("SELECT id FROM events ORDER BY id")
    return [r["id"] for r in rows]


@inject_database
def lock_pair(
    event_a: int, event_b: int, duration_minutes: int = 5, *, data_base: Database
) -> None:
    data_base.execute_query(
        """
        INSERT INTO pair_locks (event_a, event_b, expires_at)
        VALUES (%(event_a)s, %(event_b)s, CURRENT_TIMESTAMP + (%(duration)s || ' minutes')::interval)
        ON CONFLICT (event_a, event_b) DO UPDATE 
        SET expires_at = EXCLUDED.expires_at
        """,
        {"event_a": event_a, "event_b": event_b, "duration": str(duration_minutes)},
        commit=True,
    )


@inject_database
def unlock_pair(event_a: int, event_b: int, *, data_base: Database) -> None:
    data_base.execute_query(
        "DELETE FROM pair_locks WHERE (event_a = %(event_a)s AND event_b = %(event_b)s) OR (event_a = %(event_b)s AND event_b = %(event_a)s)",
        {"event_a": event_a, "event_b": event_b},
        commit=True,
    )


@inject_database
def get_locked_pairs(*, data_base: Database) -> set[frozenset[int]]:
    data_base.execute_query(
        "DELETE FROM pair_locks WHERE CURRENT_TIMESTAMP > expires_at", commit=True
    )
    rows = data_base.execute_query("SELECT event_a, event_b FROM pair_locks")
    return {frozenset((r["event_a"], r["event_b"])) for r in rows}


@inject_database
def insert_event(name: str, location: dict, *, data_base: Database) -> int:
    rows = data_base.execute_query(
        "INSERT INTO events (name, location) VALUES (%(name)s, %(location)s) RETURNING id",
        {"name": name, "location": json.dumps(location)},
        commit=True,
    )
    return rows[0]["id"]


@inject_database
def insert_entity(event_id: int, geojson: dict, *, data_base: Database) -> int:
    rows = data_base.execute_query(
        "INSERT INTO entities (event_id, geojson) VALUES (%(event_id)s, %(geojson)s) RETURNING id",
        {"event_id": event_id, "geojson": json.dumps(geojson)},
        commit=True,
    )
    return rows[0]["id"]
