function renderEntityList(containerElement, entities) {
    containerElement.innerHTML = '<h3>Entities (' + entities.length + ')</h3>';

    entities.forEach(function (entity) {
        var entityElement = createEntityElement(entity.geojson.properties);
        containerElement.appendChild(entityElement);
    });
}

function createEntityElement(properties) {
    var name = (properties && properties.name) || 'Unnamed';
    var type = (properties && properties.type) || 'unknown';
    var dotColorClass = getEntityDotClass(type);

    var element = document.createElement('div');
    element.className = 'entity-item';
    element.innerHTML =
        '<span class="entity-dot ' + dotColorClass + '"></span>' +
        '<span class="entity-name">' + name + '</span>' +
        '<span class="entity-type">' + type + '</span>';

    return element;
}

function getEntityDotClass(entityType) {
    if (KNOWN_ENTITY_TYPES.includes(entityType)) {
        return entityType;
    }
    return 'default';
}
