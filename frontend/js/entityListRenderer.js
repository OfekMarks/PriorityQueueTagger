import { ENTITY_MARKERS } from './mapStyle.js';
import { extractBounds } from './mapFeatureManager.js';

export function renderEntityList(containerElement, entities, map) {
    containerElement.innerHTML = '<h3>Entities (' + entities.length + ')</h3>';

    entities.forEach(entity => {
        var entityElement = createEntityElement(entity.geojson.properties);
        
        // Add interactivity: Fly to the entity on the map when clicked!
        entityElement.addEventListener('click', () => {
            if (!map) return;
            const bounds = new mapboxgl.LngLatBounds();
            extractBounds(bounds, entity.geojson);
            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 60, right: 60 }, maxZoom: 18, duration: 1200 });
            }
        });

        containerElement.appendChild(entityElement);
    });
}

function createEntityElement(properties) {
    var name = (properties && properties.name) || 'Unnamed';
    var type = (properties && properties.type) || 'unknown';
    var styleProps = ENTITY_MARKERS[type] || ENTITY_MARKERS.default;

    var element = document.createElement('div');
    element.className = 'entity-item';
    element.innerHTML =
        '<span class="entity-icon" style="background-color: ' + styleProps.color + '">' + styleProps.icon + '</span>' +
        '<span class="entity-name">' + name + '</span>' +
        '<span class="entity-type">' + type + '</span>';

    return element;
}
