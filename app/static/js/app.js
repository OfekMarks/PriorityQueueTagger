/**
 * Priority Queue Tagger — Frontend Logic
 *
 * Fetches tile config and event pairs from the API, renders Leaflet maps
 * with GeoJSON entities, and submits pairwise comparison decisions.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SIDE_COLORS = {
    A: '#6366f1',
    B: '#f43f5e',
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let tileConfig = null;
let currentPair = null;  // { event_a, event_b }
let eventNamesById = {};  // populated from /api/events for the modal

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch tile config and first pair in parallel
        const [tileRes, eventsRes] = await Promise.all([
            fetch('/api/tiles'),
            fetch('/api/events'),
        ]);
        tileConfig = await tileRes.json();

        const events = await eventsRes.json();
        events.forEach(e => { eventNamesById[e.id] = e.name; });

        // Calculate total pairs for progress bar
        const totalEvents = events.length;
        const totalPairs = totalEvents * (totalEvents - 1) / 2;
        window._totalPairs = totalPairs;

        await loadNextPair();
    } catch (err) {
        console.error('Init failed:', err);
    }
});

// ---------------------------------------------------------------------------
// Load a pair
// ---------------------------------------------------------------------------
async function loadNextPair() {
    showLoading(true);

    const res = await fetch('/api/pair');
    const data = await res.json();

    if (data.done) {
        showDone();
        showLoading(false);
        return;
    }

    currentPair = data;
    renderCard('A', data.event_a);
    renderCard('B', data.event_b);
    updateProgress();
    showLoading(false);
}

// ---------------------------------------------------------------------------
// Render a card
// ---------------------------------------------------------------------------
function renderCard(side, event) {
    const nameEl = document.getElementById(`name${side}`);
    const mapId = `map${side}`;
    const entitiesEl = document.getElementById(`entities${side}`);

    nameEl.textContent = event.name;

    // -- Map --
    // Browsers auto-expose `id`'d elements as window properties, so on
    // first load window[mapId] is the raw DOM element — NOT a Leaflet map.
    // Only call .remove() when it's an actual Leaflet map instance.
    const mapContainer = document.getElementById(mapId);
    if (window[`_leaflet_${mapId}`]) {
        window[`_leaflet_${mapId}`].remove();
    }
    mapContainer.innerHTML = '';

    const loc = event.location;
    const center = [loc.coordinates[1], loc.coordinates[0]]; // [lat, lng]

    const map = L.map(mapId, { zoomControl: false }).setView(center, 15);
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer(tileConfig.url_template, {
        maxZoom: tileConfig.max_zoom,
        attribution: tileConfig.attribution,
    }).addTo(map);

    // Add GeoJSON entities
    const featureCollection = {
        type: 'FeatureCollection',
        features: event.entities.map(e => e.geojson),
    };

    const sideColor = SIDE_COLORS[side];

    const geojsonLayer = L.geoJSON(featureCollection, {
        style: () => ({
            color: sideColor,
            weight: 2,
            fillOpacity: 0.2,
        }),
        pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
                radius: 7,
                fillColor: sideColor,
                color: '#fff',
                weight: 2,
                fillOpacity: 0.85,
            });
        },
        onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.name) {
                layer.bindTooltip(feature.properties.name, {
                    className: 'entity-tooltip',
                });
            }
        },
    }).addTo(map);

    // Fit bounds if we have features
    if (featureCollection.features.length > 0) {
        const bounds = geojsonLayer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.3));
        }
    }

    window[`_leaflet_${mapId}`] = map;

    // -- Entity list --
    entitiesEl.innerHTML = `<h3>Entities (${event.entities.length})</h3>`;
    event.entities.forEach(ent => {
        const props = ent.geojson.properties || {};
        const name = props.name || 'Unnamed';
        const type = props.type || 'unknown';
        const dotClass = ['building', 'equipment', 'area', 'structure', 'infrastructure'].includes(type)
            ? type : 'default';

        const item = document.createElement('div');
        item.className = 'entity-item';
        item.innerHTML = `
            <span class="entity-dot ${dotClass}"></span>
            <span class="entity-name">${name}</span>
            <span class="entity-type">${type}</span>
        `;
        entitiesEl.appendChild(item);
    });

    // Schedule a resize after the map is rendered (handles container size issues)
    setTimeout(() => map.invalidateSize(), 100);
}

// ---------------------------------------------------------------------------
// Submit a choice
// ---------------------------------------------------------------------------
async function submitChoice(side) {
    if (!currentPair) return;

    const winner = side === 'A' ? currentPair.event_a : currentPair.event_b;
    const loser = side === 'A' ? currentPair.event_b : currentPair.event_a;

    // Brief visual feedback
    const btn = document.getElementById(`choose${side}`);
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => { btn.style.transform = ''; }, 150);

    try {
        await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ winner_id: winner.id, loser_id: loser.id }),
        });
        await loadNextPair();
    } catch (err) {
        console.error('Compare failed:', err);
    }
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------
async function updateProgress() {
    try {
        const res = await fetch('/api/comparisons');
        const comparisons = await res.json();
        const done = comparisons.length;
        const total = window._totalPairs || 1;
        const pct = Math.min(100, (done / total) * 100);

        document.getElementById('progressFill').style.width = `${pct}%`;
        document.getElementById('progressText').textContent = `${done} / ${total} comparisons`;
    } catch (err) {
        // Non-critical, ignore
    }
}

// ---------------------------------------------------------------------------
// Done / Comparisons modal
// ---------------------------------------------------------------------------
function showDone() {
    document.getElementById('comparisonContainer').style.display = 'none';
    document.getElementById('doneScreen').style.display = 'flex';
    updateProgress();
}

async function viewComparisons() {
    const res = await fetch('/api/comparisons');
    const comparisons = await res.json();

    const body = document.getElementById('comparisonsBody');
    if (comparisons.length === 0) {
        body.innerHTML = '<p style="color:var(--text-secondary)">No comparisons yet.</p>';
    } else {
        body.innerHTML = comparisons.map((c, i) => `
            <div class="comparison-row">
                <span class="comp-number">${i + 1}.</span>
                <span class="comp-winner">${eventNamesById[c.winner_id] || c.winner_id}</span>
                <span class="comp-arrow">›</span>
                <span class="comp-loser">${eventNamesById[c.loser_id] || c.loser_id}</span>
            </div>
        `).join('');
    }

    document.getElementById('comparisonsModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('comparisonsModal').style.display = 'none';
}

// ---------------------------------------------------------------------------
// Loading overlay
// ---------------------------------------------------------------------------
function showLoading(show) {
    const el = document.getElementById('loadingOverlay');
    if (show) {
        el.style.display = 'flex';
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
        setTimeout(() => { el.style.display = 'none'; }, 400);
    }
}
