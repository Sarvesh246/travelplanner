/** OpenStreetMap static map image (no API key). Used as a default trip card cover when a stop has coordinates. */
export function osmStaticMapImageUrl(lat: number, lon: number, size: { w: number; h: number } = { w: 640, h: 264 }): string {
  const { w, h } = size;
  // https://staticmap.openstreetmap.de/ — center is lat,lon; zoom 5–6 works well for “region”
  const params = new URLSearchParams({
    center: `${lat},${lon}`,
    zoom: "6",
    size: `${w}x${h}`,
    maptype: "mapnik",
  });
  return `https://staticmap.openstreetmap.de/staticmap.php?${params.toString()}`;
}
