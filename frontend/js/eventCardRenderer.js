import { SIDE_COLORS } from './constants.js';
import { renderMap } from './mapRenderer.js';
import { renderEntityList } from './entityListRenderer.js';

export function renderEventCard(side, event, tileConfig) {
    var nameElement = document.getElementById('name' + side);
    var mapContainerId = 'map' + side;
    var entitiesContainer = document.getElementById('entities' + side);
    var color = SIDE_COLORS[side];

    nameElement.textContent = event.name;
    renderMap(mapContainerId, event, tileConfig, color);
    renderEntityList(entitiesContainer, event.entities);
}
