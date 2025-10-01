import Mapbox from '@rnmapbox/maps';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN!;

Mapbox.setAccessToken(MAPBOX_TOKEN);

export { Mapbox };

export const BUJUMBURA_CENTER = {
  latitude: -3.3731,
  longitude: 29.3600,
};

export const DEFAULT_ZOOM = 12;
