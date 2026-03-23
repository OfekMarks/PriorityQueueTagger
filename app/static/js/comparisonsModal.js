import { fetchAllComparisons } from './api.js';
import { updateProgressBar } from './progressTracker.js';

export function showCompletionScreen() {
    document.getElementById('comparisonContainer').style.display = 'none';
    document.getElementById('doneScreen').style.display = 'flex';
    updateProgressBar();
}

export async function openComparisonsModal() {
    var comparisons = await fetchAllComparisons();
    var modalBody = document.getElementById('comparisonsBody');

    if (comparisons.length === 0) {
        modalBody.innerHTML = '<p style="color:var(--text-secondary)">No comparisons yet.</p>';
    } else {
        modalBody.innerHTML = buildComparisonRows(comparisons);
    }

    document.getElementById('comparisonsModal').style.display = 'flex';
}

function buildComparisonRows(comparisons) {
    return comparisons.map((comparison, index) => {
        return '<div class="comparison-row">' +
            '<span class="comp-number">' + (index + 1) + '.</span>' +
            '<span class="comp-winner">' + comparison.winner_name + '</span>' +
            '<span class="comp-arrow">›</span>' +
            '<span class="comp-loser">' + comparison.loser_name + '</span>' +
            '</div>';
    }).join('');
}

export function closeComparisonsModal() {
    document.getElementById('comparisonsModal').style.display = 'none';
}
