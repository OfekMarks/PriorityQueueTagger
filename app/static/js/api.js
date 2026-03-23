export async function fetchTileConfig() {
    const response = await fetch('/api/tiles');
    return response.json();
}

export async function fetchAllEvents() {
    const response = await fetch('/api/events');
    return response.json();
}

export async function fetchNextPair() {
    const response = await fetch('/api/pair');
    return response.json();
}

export async function fetchAllComparisons() {
    const response = await fetch('/api/comparisons');
    return response.json();
}

export async function submitComparison(winnerId, loserId) {
    const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_id: winnerId, loser_id: loserId }),
    });
    return response.json();
}
