var tileConfig = null;
var currentPair = null;

document.addEventListener('DOMContentLoaded', initializeApplication);

async function initializeApplication() {
    try {
        var initialData = await loadInitialData();
        tileConfig = initialData.tileConfig;
        setTotalPairsFromEventCount(initialData.eventCount);

        await loadAndDisplayNextPair();
    } catch (error) {
        console.error('Application initialization failed:', error);
    }
}

async function loadInitialData() {
    var [tiles, events] = await Promise.all([fetchTileConfig(), fetchAllEvents()]);

    return {
        tileConfig: tiles,
        eventCount: events.length,
    };
}

async function loadAndDisplayNextPair() {
    showLoadingOverlay();

    var pairData = await fetchNextPair();

    if (pairData.done) {
        showCompletionScreen();
        hideLoadingOverlay();
        return;
    }

    currentPair = pairData;
    renderEventCard('A', pairData.event_a, tileConfig);
    renderEventCard('B', pairData.event_b, tileConfig);
    updateProgressBar();
    hideLoadingOverlay();
}

async function submitChoice(side) {
    if (!currentPair) {
        return;
    }

    var winnerId = side === 'A' ? currentPair.event_a.id : currentPair.event_b.id;
    var loserId = side === 'A' ? currentPair.event_b.id : currentPair.event_a.id;

    animateButtonPress(side);

    try {
        await submitComparison(winnerId, loserId);
        await loadAndDisplayNextPair();
    } catch (error) {
        console.error('Comparison submission failed:', error);
    }
}

function animateButtonPress(side) {
    var button = document.getElementById('choose' + side);
    button.style.transform = 'scale(0.95)';
    setTimeout(function () { button.style.transform = ''; }, BUTTON_FEEDBACK_DURATION_MS);
}

function viewComparisons() {
    openComparisonsModal();
}

function closeModal() {
    closeComparisonsModal();
}
