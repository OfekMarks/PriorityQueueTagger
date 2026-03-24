import type { Feature, Point } from 'geojson';

export interface Entity {
    id: string;
    geojson: Feature;
}

export interface PointEntity {
    id: string;
    geojson: Feature<Point>;
}

export interface EventData {
    id: string;
    name: string;
    location: Point;
    entities: Entity[];
}

export interface ComparisonSubmissionResponse {
    id: number | string;
    winner_id: number | string;
    loser_id: number | string;
}

export type ComparisonPair =
    | { done: true }
    | { done: false; event_a: EventData; event_b: EventData };

export interface TileConfig {
    provider: string;
    token: string;
    style: string;
    name: string;
    url_template: string;
    attribution: string;
    max_zoom: number;
}

export interface CompletedComparison {
    winner_id: string;
    loser_id: string;
    winner_name: string;
    loser_name: string;
}
