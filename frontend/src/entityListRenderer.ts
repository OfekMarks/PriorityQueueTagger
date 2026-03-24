import { ENTITY_MARKERS } from './mapStyle';
import { extractBounds } from './mapFeatureManager';
import { Entity } from './types';
import * as mapboxgl from 'mapbox-gl';

export function renderEntityList(containerElement: HTMLElement, entities: Entity[], map: mapboxgl.Map): void {
    containerElement.innerHTML = '<h3>Entities (' + entities.length + ')</h3>';

    entities.forEach(entity => {
        var entityElement = createEntityElement(entity.geojson.properties);
        entityElement.addEventListener('click', () => flyToEntity(map, entity));

        containerElement.appendChild(entityElement);
    });
}

function flyToEntity(map: mapboxgl.Map | null, entity: Entity): void {
    if (!map)
        return;

    const bounds = new mapboxgl.LngLatBounds();
    extractBounds(bounds, entity.geojson.geometry);

    if (bounds.isEmpty())
        return;

    map.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 18,
        duration: 1200
    });
}

function createEntityElement(properties: Record<string, any> | null): HTMLElement {
    var name = (properties && properties.name) || 'Unnamed';
    var type = (properties && properties.type) || 'unknown';
    var styleProps = ENTITY_MARKERS[type] || ENTITY_MARKERS.default;

    var element = document.createElement('div');
    element.className = 'entity-item';
    element.innerHTML =
        '<span class="entity-icon" style="background-color: ' +
        styleProps.color + '">' + styleProps.icon + '</span>' +
        '<span class="entity-name">' + name + '</span>' +
        '<span class="entity-type">' + type + '</span>';

    return element;
}
