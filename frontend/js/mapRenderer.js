import { DEFAULT_MAP_ZOOM, MAP_BOUNDS_PADDING, MAP_RESIZE_DELAY_MS } from './constants.js';

const leafletInstances = {};

function clearExistingMap(containerId) {
    if (leafletInstances[containerId]) {
        leafletInstances[containerId].remove();
        delete leafletInstances[containerId];
    }

    const container = document.getElementById(containerId);
    container.innerHTML = '';
}

function createBaseMap(containerId, centerLatitude, centerLongitude, tileConfig) {
    const map = L.map(containerId, { zoomControl: false })
        .setView([centerLatitude, centerLongitude], DEFAULT_MAP_ZOOM);

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer(tileConfig.url_template, {
        maxZoom: tileConfig.max_zoom,
        attribution: tileConfig.attribution,
    }).addTo(map);

    leafletInstances[containerId] = map;
    return map;
}

function addGeoJsonFeatures(map, entities, color) {
    if (entities.length === 0) {
        return;
    }

    const featureCollection = buildFeatureCollection(entities);
    const geojsonLayer = L.geoJSON(featureCollection, {
        style: function () {
            return { color: color, weight: 2, fillOpacity: 0.2 };
        },
        pointToLayer: function (_, latitudeLongitude) {
            return L.circleMarker(latitudeLongitude, {
                radius: 7,
                fillColor: color,
                color: '#fff',
                weight: 2,
                fillOpacity: 0.85,
            });
        },
        onEachFeature: function (feature, layer) {
            const entityName = feature.properties && feature.properties.name;
            if (entityName) {
                layer.bindTooltip(entityName);
            }
        },
    }).addTo(map);

    fitMapToFeatures(map, geojsonLayer);
}

function buildFeatureCollection(entities) {
    return {
        type: 'FeatureCollection',
        features: entities.map(entity => entity.geojson),
    };
}

function fitMapToFeatures(map, geojsonLayer) {
    const bounds = geojsonLayer.getBounds();
    if (bounds.isValid()) {
        map.fitBounds(bounds.pad(MAP_BOUNDS_PADDING));
    }
}

function scheduleMapResize(map) {
    setTimeout(() => map.invalidateSize(), MAP_RESIZE_DELAY_MS);
}

export function renderMap(containerId, event, tileConfig, color) {
    clearExistingMap(containerId);

    const [longitude, latitude] = event.location.coordinates;

    const map = createBaseMap(containerId, latitude, longitude, tileConfig);
    addGeoJsonFeatures(map, event.entities, color);
    scheduleMapResize(map);
}
