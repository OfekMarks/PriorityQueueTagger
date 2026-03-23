function showLoadingOverlay() {
    var overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';
    overlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    var overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('hidden');
    setTimeout(function () { overlay.style.display = 'none'; }, LOADING_FADE_DURATION_MS);
}
