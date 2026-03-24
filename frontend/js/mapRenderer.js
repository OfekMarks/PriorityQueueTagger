import { DEFAULT_MAP_ZOOM } from './constants.js';
import { addFeaturesToMap } from './mapFeatureManager.js';

const mapboxInstances = {};

function clearExistingMap(containerId) {
    if (mapboxInstances[containerId]) {
        mapboxInstances[containerId].remove();
        delete mapboxInstances[containerId];
    }
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

function createBaseMap(containerId, centerLatitude, centerLongitude, tileConfig) {
    mapboxgl.accessToken = tileConfig.token || '';
    
    // If no token exists, the map will fail to render gracefully
    const map = new mapboxgl.Map({
        container: containerId,
        style: tileConfig.style || 'mapbox://styles/mapbox/dark-v11',
        center: [centerLongitude, centerLatitude],
        zoom: DEFAULT_MAP_ZOOM - 1, // Mapbox zooms are roughly 1 less than Leaflet
        attributionControl: false
    });
    
    // Add custom attribution if provided
    map.addControl(new mapboxgl.AttributionControl({
        customAttribution: tileConfig.attribution
    }));
    
    // Add zoom controls
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    mapboxInstances[containerId] = map;
    return map;
}

export function renderMap(containerId, event, tileConfig) {
    clearExistingMap(containerId);

    const [longitude, latitude] = event.location.coordinates;

    const map = createBaseMap(containerId, latitude, longitude, tileConfig);
    addFeaturesToMap(map, event.entities);
    
    // Force a resize calculation shortly after creation to prevent clipping in hidden containers
    setTimeout(() => map.resize(), 100);
}
