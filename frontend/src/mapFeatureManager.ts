import { ENTITY_MARKERS, MAPBOX_LAYERS } from './mapStyle';
import { Entity, PointEntity } from './types';
import type { Feature, Geometry, Position } from 'geojson';
import * as mapboxgl from 'mapbox-gl';

export function addFeaturesToMap(map: mapboxgl.Map, entities: Entity[]): void {
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

function separateEntities(entities: Entity[]): { pointEntities: PointEntity[], geometryFeatures: Feature[] } {
    const pointEntities: PointEntity[] = [];
    const geometryFeatures: Feature[] = [];

    entities.forEach(entity => {
        const geojson = entity.geojson;
        const geomType = geojson.geometry.type;

        if (geomType === 'Point') {
            pointEntities.push(entity as PointEntity);
        } else {
            geometryFeatures.push(geojson);
        }
    });

    return { pointEntities, geometryFeatures };
}

function computeBounds(entities: Entity[]): mapboxgl.LngLatBounds {
    const bounds = new mapboxgl.LngLatBounds();

    entities.forEach(entity => {
        extractBounds(bounds, entity.geojson.geometry);
    });

    return bounds;
}

export function extractBounds(bounds: mapboxgl.LngLatBounds, geometry: Geometry): void {
    if (geometry.type === 'GeometryCollection') {
        geometry.geometries.forEach(g => extractBounds(bounds, g));
        return;
    }

    const extendPosition = (c: Position) => bounds.extend(c as [number, number]);

    if (geometry.type === 'Point')
        extendPosition(geometry.coordinates);
    else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint')
        geometry.coordinates.forEach(extendPosition);
    else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString')
        geometry.coordinates.forEach(ring => ring.forEach(extendPosition));
    else if (geometry.type === 'MultiPolygon')
        geometry.coordinates.forEach(poly => poly.forEach(ring => ring.forEach(extendPosition)));
}

function addVectorLayers(map: mapboxgl.Map, geometryFeatures: Feature[]): void {
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

function addHtmlMarkers(map: mapboxgl.Map, pointEntities: PointEntity[]): void {
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
            .setLngLat(geojson.geometry.coordinates as [number, number])
            .setPopup(popup)
            .addTo(map);
    });
}

function fitMapBounds(map: mapboxgl.Map, bounds: mapboxgl.LngLatBounds): void {
    map.fitBounds(bounds, { padding: 40, maxZoom: 18, duration: 0 });
}
