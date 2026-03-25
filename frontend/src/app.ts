import { fetchTileConfig, fetchAllEvents, fetchNextPair, submitComparison, releaseLock } from './api';
import { renderEventCard } from './eventCardRenderer';
import { showCompletionScreen, openComparisonsModal, closeComparisonsModal } from './comparisonsModal';
import { showLoadingOverlay, hideLoadingOverlay } from './loadingOverlay';
import { BUTTON_FEEDBACK_DURATION_MS } from './constants';
import { TileConfig, ComparisonPair } from './types';

let tileConfig: TileConfig | null = null;
let currentPair: ComparisonPair | null = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();

    document.getElementById('chooseA')?.addEventListener('click', () => submitChoice('A'));
    document.getElementById('chooseB')?.addEventListener('click', () => submitChoice('B'));
    document.getElementById('btnViewComparisons')?.addEventListener('click', openComparisonsModal);
    document.getElementById('btnCloseModal')?.addEventListener('click', closeComparisonsModal);
});

window.addEventListener('beforeunload', () => {
    if (currentPair && !currentPair.done) {
        releaseLock(currentPair.event_a.id, currentPair.event_b.id);
    }
});

async function initializeApplication(): Promise<void> {
    try {
        const initialData = await loadInitialData();
        tileConfig = initialData.tileConfig;

        await loadAndDisplayNextPair();
    } catch (error) {
        console.error('Application initialization failed:', error);
    }
}

async function loadInitialData(): Promise<{ tileConfig: TileConfig; eventCount: number }> {
    const [tiles, events] = await Promise.all([fetchTileConfig(), fetchAllEvents()]);

    return {
        tileConfig: tiles,
        eventCount: events.length,
    };
}

async function loadAndDisplayNextPair(): Promise<void> {
    showLoadingOverlay();

    const pairData = await fetchNextPair();

    const isComparisonComplete = pairData.done;
    if (isComparisonComplete) {
        showCompletionScreen();
        hideLoadingOverlay();
        return;
    }

    currentPair = pairData;
    if (tileConfig) {
        renderEventCard('A', pairData.event_a, tileConfig);
        renderEventCard('B', pairData.event_b, tileConfig);
    }

    hideLoadingOverlay();
}

async function submitChoice(side: 'A' | 'B'): Promise<void> {
    if (!currentPair || currentPair.done) {
        return;
    }

    const winnerId = side === 'A' ? currentPair.event_a.id : currentPair.event_b.id;
    const loserId = side === 'A' ? currentPair.event_b.id : currentPair.event_a.id;

    animateButtonPress(side);

    try {
        await submitComparison(winnerId, loserId);
        await loadAndDisplayNextPair();
    } catch (error) {
        console.error('Comparison submission failed:', error);
    }
}

function animateButtonPress(side: 'A' | 'B'): void {
    const button = document.getElementById('choose' + side);
    if (button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => { button.style.transform = ''; }, BUTTON_FEEDBACK_DURATION_MS);
    }
}
