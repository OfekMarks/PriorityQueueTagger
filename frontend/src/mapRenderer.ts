import { DEFAULT_MAP_ZOOM } from './constants';
import { addFeaturesToMap } from './mapFeatureManager';
import { EventData, TileConfig } from './types';
import mapboxgl from 'mapbox-gl';

const mapboxInstances: Record<string, mapboxgl.Map> = {};

function clearExistingMap(containerId: string): void {
    if (mapboxInstances[containerId]) {
        mapboxInstances[containerId].remove();
        delete mapboxInstances[containerId];
    }

    const container = document.getElementById(containerId);

    if (container)
        container.innerHTML = '';
}

function createBaseMap(containerId: string, center: [number, number], tileConfig: TileConfig): mapboxgl.Map {
    (mapboxgl as any).accessToken = tileConfig.token || '';

    const map = new mapboxgl.Map({
        container: containerId,
        style: tileConfig.style || 'mapbox://styles/mapbox/dark-v11',
        center,
        zoom: DEFAULT_MAP_ZOOM - 1,
        attributionControl: false
    });

    map.addControl(new mapboxgl.AttributionControl({
        customAttribution: tileConfig.attribution
    }));
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    mapboxInstances[containerId] = map;
    return map;
}

export function renderMap(containerId: string, event: EventData, tileConfig: TileConfig): mapboxgl.Map {
    clearExistingMap(containerId);

    const map = createBaseMap(containerId, event.location.coordinates as [number, number], tileConfig);
    addFeaturesToMap(map, event.entities);

    setTimeout(() => map.resize(), 100);

    return map;
}
