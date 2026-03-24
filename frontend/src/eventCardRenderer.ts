import { renderMap } from './mapRenderer';
import { renderEntityList } from './entityListRenderer';
import { TileConfig, EventData } from './types';

export function renderEventCard(side: 'A' | 'B', event: EventData, tileConfig: TileConfig): void {
    const nameElement = document.getElementById('name' + side);
    const mapContainerId = 'map' + side;
    const entitiesContainer = document.getElementById('entities' + side);

    if (nameElement)
        nameElement.textContent = event.name;

    const map = renderMap(mapContainerId, event, tileConfig);
    if (entitiesContainer)
        renderEntityList(entitiesContainer, event.entities, map);
}
