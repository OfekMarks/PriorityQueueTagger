let totalPairsCompleted = 0;
let totalPairsTarget = 0;

export function setTotalPairsFromEventCount(eventCount: number): void {
    totalPairsTarget = (eventCount * (eventCount - 1)) / 2;
}

export function updateProgressBar(): void {
    totalPairsCompleted++;
    const percentage = Math.min((totalPairsCompleted / totalPairsTarget) * 100, 100);

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (progressBar)
        progressBar.style.width = `${percentage}%`;
    if (progressText)
        progressText.textContent = `${totalPairsCompleted} / ${totalPairsTarget} comparisons`;
}
