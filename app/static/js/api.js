async function fetchTileConfig() {
    const response = await fetch('/api/tiles');
    return response.json();
}

async function fetchAllEvents() {
    const response = await fetch('/api/events');
    return response.json();
}

async function fetchNextPair() {
    const response = await fetch('/api/pair');
    return response.json();
}

async function fetchAllComparisons() {
    const response = await fetch('/api/comparisons');
    return response.json();
}

async function submitComparison(winnerId, loserId) {
    const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_id: winnerId, loser_id: loserId }),
    });
    return response.json();
}
