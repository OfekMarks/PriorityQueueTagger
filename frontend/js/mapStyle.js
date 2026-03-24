export const ENTITY_MARKERS = {
    building: { color: '#8b5cf6', icon: '🏢' },
    equipment: { color: '#f59e0b', icon: '⚙️' },
    area: { color: '#10b981', icon: '📍' },
    structure: { color: '#f43f5e', icon: '🏗️' },
    infrastructure: { color: '#3b82f6', icon: '🌉' },
    default: { color: '#9ca3af', icon: '🔹' }
};

export const MAPBOX_LAYERS = [
    {
        id: 'entities-fill-building',
        type: 'fill',
        source: 'entitiesGeometry',
        filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'type'], 'building']],
        paint: { 'fill-color': '#8b5cf6', 'fill-opacity': 0.3 }
    },
    {
        id: 'entities-line-building',
        type: 'line',
        source: 'entitiesGeometry',
        filter: ['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'LineString']], ['==', ['get', 'type'], 'building']],
        paint: { 'line-color': '#8b5cf6', 'line-width': 2 }
    },
    {
        id: 'entities-fill-equipment',
        type: 'fill',
        source: 'entitiesGeometry',
        filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'type'], 'equipment']],
        paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.2 }
    },
    {
        id: 'entities-line-equipment',
        type: 'line',
        source: 'entitiesGeometry',
        filter: ['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'LineString']], ['==', ['get', 'type'], 'equipment']],
        paint: { 'line-color': '#f59e0b', 'line-width': 2, 'line-dasharray': [2, 2] }
    },
    {
        id: 'entities-fill-area',
        type: 'fill',
        source: 'entitiesGeometry',
        filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'type'], 'area']],
        paint: { 'fill-color': '#10b981', 'fill-opacity': 0.15 }
    },
    {
        id: 'entities-line-area',
        type: 'line',
        source: 'entitiesGeometry',
        filter: ['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'LineString']], ['==', ['get', 'type'], 'area']],
        paint: { 'line-color': '#10b981', 'line-width': 2 }
    },
    {
        id: 'entities-fill-structure',
        type: 'fill',
        source: 'entitiesGeometry',
        filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'type'], 'structure']],
        paint: { 'fill-color': '#f43f5e', 'fill-opacity': 0.2 }
    },
    {
        id: 'entities-line-structure',
        type: 'line',
        source: 'entitiesGeometry',
        filter: ['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'LineString']], ['==', ['get', 'type'], 'structure']],
        paint: { 'line-color': '#f43f5e', 'line-width': 3 }
    },
    {
        id: 'entities-fill-infrastructure',
        type: 'fill',
        source: 'entitiesGeometry',
        filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'type'], 'infrastructure']],
        paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.2 }
    },
    {
        id: 'entities-line-infrastructure',
        type: 'line',
        source: 'entitiesGeometry',
        filter: ['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'LineString']], ['==', ['get', 'type'], 'infrastructure']],
        paint: { 'line-color': '#3b82f6', 'line-width': 2 }
    },
    {
        id: 'entities-fill-default',
        type: 'fill',
        source: 'entitiesGeometry',
        filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['!', ['in', ['get', 'type'], 'building', 'equipment', 'area', 'structure', 'infrastructure']]],
        paint: { 'fill-color': '#9ca3af', 'fill-opacity': 0.2 }
    },
    {
        id: 'entities-line-default',
        type: 'line',
        source: 'entitiesGeometry',
        filter: ['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'LineString']], ['!', ['in', ['get', 'type'], 'building', 'equipment', 'area', 'structure', 'infrastructure']]],
        paint: { 'line-color': '#9ca3af', 'line-width': 1 }
    }
];
