import { ENTITY_MARKERS, MAPBOX_LAYERS } from './mapStyle.js';

export function addFeaturesToMap(map, entities) {
    if (!entities || entities.length === 0) return;

    const { pointEntities, geometryFeatures } = separateEntities(entities);
    const bounds = computeBounds(entities);

    map.on('load', () => {
        addVectorLayers(map, geometryFeatures);
        addHtmlMarkers(map, pointEntities);

        if (entities.length > 0) {
            fitMapBounds(map, bounds);
        }
    });
}

function separateEntities(entities) {
    const pointEntities = [];
    const geometryFeatures = [];

    entities.forEach(entity => {
        const geojson = entity.geojson;
        const geomType = geojson.geometry.type;

        if (geomType === 'Point') {
            pointEntities.push(entity);
        } else {
            geometryFeatures.push(geojson);
        }
    });

    return { pointEntities, geometryFeatures };
}

function computeBounds(entities) {
    const bounds = new mapboxgl.LngLatBounds();

    entities.forEach(entity => {
        extractBounds(bounds, entity.geojson);
    });

    return bounds;
}

function extractBounds(bounds, geojson) {
    const geomType = geojson.geometry.type;
    const coords = geojson.geometry.coordinates;

    if (geomType === 'Point') {
        bounds.extend(coords);
    } else if (geomType === 'LineString' || geomType === 'MultiPoint') {
        coords.forEach(c => bounds.extend(c));
    } else if (geomType === 'Polygon' || geomType === 'MultiLineString') {
        coords.forEach(ring => ring.forEach(c => bounds.extend(c)));
    } else if (geomType === 'MultiPolygon') {
        coords.forEach(poly => poly.forEach(ring => ring.forEach(c => bounds.extend(c))));
    }
}

function addVectorLayers(map, geometryFeatures) {
    if (geometryFeatures.length === 0) return;

    map.addSource('entitiesGeometry', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: geometryFeatures
        }
    });

    MAPBOX_LAYERS.forEach(layer => map.addLayer(layer));
}

function addHtmlMarkers(map, pointEntities) {
    pointEntities.forEach(entity => {
        const geojson = entity.geojson;
        const type = geojson.properties?.type || 'unknown';
        const styleProps = ENTITY_MARKERS[type] || ENTITY_MARKERS.default;

        const el = document.createElement('div');
        el.className = 'custom-map-marker';
        el.innerHTML = `<div style="background-color: ${styleProps.color}">${styleProps.icon}</div>`;

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false, closeOnClick: true })
            .setText(geojson.properties?.name || 'Unknown');

        new mapboxgl.Marker({ element: el })
            .setLngLat(geojson.geometry.coordinates)
            .setPopup(popup)
            .addTo(map);
    });
}

function fitMapBounds(map, bounds) {
    map.fitBounds(bounds, { padding: 40, maxZoom: 18, duration: 0 });
}
