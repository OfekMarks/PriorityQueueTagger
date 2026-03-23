"""
Comparison engine — selects the next pair of events for comparison.

Strategy: least-compared-first, skipping already-compared pairs.
"""

from __future__ import annotations

from itertools import combinations

from app.models.database import (
    get_event_ids,
    get_compared_pairs,
    get_comparison_count_per_event,
)


def _pair_score(pair: frozenset[int], counts: dict[int, int]) -> int:
    a, b = pair
    return counts.get(a, 0) + counts.get(b, 0)


def get_next_pair() -> tuple[int, int] | None:
    """
    Pick the next pair of events to compare.

    Returns (event_id_a, event_id_b) or None if all pairs have been compared.

    Strategy:
      1. Build the set of all possible pairs.
      2. Subtract already-compared pairs.
      3. Among remaining pairs, pick the one where the sum of comparisons
         for both events is lowest (least-compared-first).
    """
    event_ids = get_event_ids()
    if len(event_ids) < 2:
        return None

    all_pairs = {frozenset(p) for p in combinations(event_ids, 2)}
    compared = get_compared_pairs()
    remaining = all_pairs - compared

    if not remaining:
        return None

    counts = get_comparison_count_per_event()

    chosen = min(remaining, key=lambda p: _pair_score(p, counts))
    a, b = sorted(chosen)
    return (a, b)
