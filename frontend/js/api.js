const API_BASE_URL = 'http://localhost:8000/api';

export async function fetchTileConfig() {
    const response = await fetch(`${API_BASE_URL}/tiles`);
    return response.json();
}

export async function fetchAllEvents() {
    const response = await fetch(`${API_BASE_URL}/events`);
    return response.json();
}

export async function fetchNextPair() {
    const response = await fetch(`${API_BASE_URL}/pair`);
    return response.json();
}

export async function fetchAllComparisons() {
    const response = await fetch(`${API_BASE_URL}/comparisons`);
    return response.json();
}

export async function submitComparison(winnerId, loserId) {
    const response = await fetch(`${API_BASE_URL}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_id: winnerId, loser_id: loserId }),
    });
    return response.json();
}
