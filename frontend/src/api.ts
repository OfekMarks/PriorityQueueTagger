import { TileConfig, EventData, ComparisonPair, CompletedComparison, ComparisonSubmissionResponse } from './types.js';

const API_BASE_URL = 'http://localhost:8000/api';

export async function fetchTileConfig(): Promise<TileConfig> {
    const response = await fetch(`${API_BASE_URL}/tiles`);
    return response.json();
}

export async function fetchAllEvents(): Promise<EventData[]> {
    const response = await fetch(`${API_BASE_URL}/events`);
    return response.json();
}

export async function fetchNextPair(): Promise<ComparisonPair> {
    const response = await fetch(`${API_BASE_URL}/pair`);
    return response.json();
}

export async function fetchAllComparisons(): Promise<CompletedComparison[]> {
    const response = await fetch(`${API_BASE_URL}/comparisons`);
    return response.json();
}

export async function submitComparison(winnerId: string, loserId: string): Promise<ComparisonSubmissionResponse> {
    const response = await fetch(`${API_BASE_URL}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_id: winnerId, loser_id: loserId }),
    });
    return response.json();
}

export function releaseLock(eventAId: string, eventBId: string) {
    // Fire-and-forget, keepalive ensures the browser doesn't cancel it when the tab closes
    fetch(`${API_BASE_URL}/release-lock`, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_a: eventAId, event_b: eventBId }),
    }).catch(() => {
        // Silently fail if server is down during tab close
    });
}
