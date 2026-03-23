var totalPairsCount = 0;

function setTotalPairsFromEventCount(eventCount) {
    totalPairsCount = eventCount * (eventCount - 1) / 2;
}

async function updateProgressBar() {
    try {
        var comparisons = await fetchAllComparisons();
        var completedCount = comparisons.length;
        var percentage = Math.min(100, (completedCount / totalPairsCount) * 100);

        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('progressText').textContent =
            completedCount + ' / ' + totalPairsCount + ' comparisons';
    } catch (error) {
        // Progress update is non-critical
    }
}
