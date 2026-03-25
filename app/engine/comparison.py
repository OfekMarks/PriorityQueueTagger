"""
Comparison engine — selects the next pair of events for comparison.

Strategy: least-compared-first, skipping already-compared pairs.
"""

from __future__ import annotations

from itertools import combinations

import networkx as nx

from app.models.database import (
    get_event_ids,
    get_compared_pairs,
    get_locked_pairs,
    lock_pair,
)


def _build_priority_graph(event_ids: list[int]) -> nx.DiGraph:
    comparisons = get_compared_pairs()
    locked_pairs = get_locked_pairs()

    priority_graph = nx.DiGraph()
    priority_graph.add_nodes_from(event_ids)

    for u, v in comparisons:
        priority_graph.add_edge(u, v)

    for u, v in locked_pairs:
        priority_graph.add_edge(u, v)
        priority_graph.add_edge(v, u)

    return priority_graph


def _calculate_implicit_comparison_gain(
    closure_graph: nx.DiGraph, event_a: int, event_b: int
) -> tuple[int, int]:
    """
    Calculate the minimum guaranteed number of new transitive relationships
    that will be established by comparing event_a and event_b.
    """
    ancestors_a = len(list(closure_graph.predecessors(event_a))) + 1
    descendants_a = len(list(closure_graph.successors(event_a))) + 1

    ancestors_b = len(list(closure_graph.predecessors(event_b))) + 1
    descendants_b = len(list(closure_graph.successors(event_b))) + 1

    implicit_comparisons_if_a_greater_than_b = ancestors_a * descendants_b
    implicit_comparisons_if_b_greater_than_a = ancestors_b * descendants_a

    minimum_implicit_comparisons = min(
        implicit_comparisons_if_a_greater_than_b,
        implicit_comparisons_if_b_greater_than_a,
    )

    num_nodes = closure_graph.number_of_nodes()
    total_possible_relationships = (
        num_nodes * (num_nodes - 1)
        - ancestors_a
        - descendants_a
        - ancestors_b
        - descendants_b
    )

    return minimum_implicit_comparisons, total_possible_relationships


def get_next_pair() -> tuple[int, int] | None:
    event_ids = get_event_ids()
    if len(event_ids) < 2:
        return None

    priority_graph = _build_priority_graph(event_ids)
    closure_graph = nx.transitive_closure(priority_graph)

    feasible_pairs = []

    for u, v in combinations(event_ids, 2):
        if not closure_graph.has_edge(u, v) and not closure_graph.has_edge(v, u):
            feasible_pairs.append((u, v))

    if not feasible_pairs:
        return None

    best_pair = max(
        feasible_pairs,
        key=lambda pair: _calculate_implicit_comparison_gain(closure_graph, *pair),
    )

    lock_pair(*best_pair, duration_minutes=5)

    return best_pair
