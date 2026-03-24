import { ENTITY_MARKERS } from './mapStyle.js';

export function renderEntityList(containerElement, entities) {
    containerElement.innerHTML = '<h3>Entities (' + entities.length + ')</h3>';

    entities.forEach(entity => {
        var entityElement = createEntityElement(entity.geojson.properties);
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
