import { fetchTileConfig, fetchAllEvents, fetchNextPair, submitComparison, releaseLock } from './api.js';
import { renderEventCard } from './eventCardRenderer.js';
import { setTotalPairsFromEventCount, updateProgressBar } from './progressTracker.js';
import { showCompletionScreen, openComparisonsModal, closeComparisonsModal } from './comparisonsModal.js';
import { showLoadingOverlay, hideLoadingOverlay } from './loadingOverlay.js';
import { BUTTON_FEEDBACK_DURATION_MS } from './constants.js';

var tileConfig = null;
var currentPair = null;

document.addEventListener('DOMContentLoaded', initializeApplication);

window.addEventListener('beforeunload', () => {
    if (currentPair && !currentPair.done && currentPair.event_a && currentPair.event_b) {
        releaseLock(currentPair.event_a.id, currentPair.event_b.id);
    }
});

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

    var isComparisonComplete = pairData.done;
    if (isComparisonComplete) {
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
    setTimeout(() => { button.style.transform = ''; }, BUTTON_FEEDBACK_DURATION_MS);
}

function viewComparisons() {
    openComparisonsModal();
}

function closeModal() {
    closeComparisonsModal();
}

// Expose handlers to global window object so HTML onclick attributes can reach them
window.submitChoice = submitChoice;
window.viewComparisons = viewComparisons;
window.closeModal = closeModal;
