"""
Tile provider abstraction — decouples map tile source from the rest of the app.

To switch tile sources, change ACTIVE_PROVIDER below.
The frontend fetches tile config from /api/tiles and never hardcodes a URL.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class TileProvider:
    """Base configuration for a map tile source."""

    name: str
    url_template: str
    attribution: str
    max_zoom: int = 19


# --- Concrete providers ---------------------------------------------------

OSM_CDN = TileProvider(
    name="OpenStreetMap (CDN)",
    url_template="https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    max_zoom=19,
)

LOCAL_TILES = TileProvider(
    name="Local Tiles",
    url_template="/static/tiles/{z}/{x}/{y}.png",
    attribution="Local tile server",
    max_zoom=19,
)

# ---------------------------------------------------------------------------
# Change this to swap tile source (e.g. LOCAL_TILES for air-gapped envs)
# ---------------------------------------------------------------------------
ACTIVE_PROVIDER: TileProvider = OSM_CDN


def get_tile_config() -> dict:
    """Return the active tile provider config as a dict (sent to frontend)."""
    return {
        "name": ACTIVE_PROVIDER.name,
        "url_template": ACTIVE_PROVIDER.url_template,
        "attribution": ACTIVE_PROVIDER.attribution,
        "max_zoom": ACTIVE_PROVIDER.max_zoom,
    }
