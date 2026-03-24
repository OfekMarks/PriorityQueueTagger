import { LOADING_FADE_DURATION_MS } from './constants';

export function showLoadingOverlay(): void {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto'; // Prevent clicks while loading
    }
}

export function hideLoadingOverlay(): void {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay)
        overlay.style.opacity = '0';

    setTimeout(() => {
        if (overlay)
            overlay.style.pointerEvents = 'none';
    }, LOADING_FADE_DURATION_MS);
}
