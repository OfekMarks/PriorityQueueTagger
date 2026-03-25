import { fetchAllComparisons } from './api';
import { CompletedComparison } from './types';

export function showCompletionScreen(): void {
    const comparisonContainer = document.getElementById('comparisonContainer');
    const doneScreen = document.getElementById('doneScreen');

    if (comparisonContainer)
        comparisonContainer.style.display = 'none';
    if (doneScreen)
        doneScreen.style.display = 'flex';
}

export async function openComparisonsModal(): Promise<void> {
    const comparisons = await fetchAllComparisons();
    const modalBody = document.getElementById('comparisonsBody');

    if (modalBody) {
        if (comparisons.length === 0) {
            modalBody.innerHTML = '<p style="color:var(--text-secondary)">No comparisons yet.</p>';
        } else {
            modalBody.innerHTML = buildComparisonRows(comparisons);
        }
    }

    const modal = document.getElementById('comparisonsModal');
    if (modal)
        modal.style.display = 'flex';
}

function buildComparisonRows(comparisons: CompletedComparison[]): string {
    return comparisons.map((comparison, index) => {
        return '<div class="comparison-row">' +
            '<span class="comp-number">' + (index + 1) + '.</span>' +
            '<span class="comp-winner">' + comparison.winner_name + '</span>' +
            '<span class="comp-arrow">›</span>' +
            '<span class="comp-loser">' + comparison.loser_name + '</span>' +
            '</div>';
    }).join('');
}

export function closeComparisonsModal(): void {
    const modal = document.getElementById('comparisonsModal');
    if (modal)
        modal.style.display = 'none';
}
