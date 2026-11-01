// Photos in public/photos, matched by a word in the trip's place name.
// Trips without a match (e.g. added later with /trip) keep the initial tile.
const PHOTOS: Record<string, string> = {
  lisbon: "/photos/lisbon.jpg",
  asheville: "/photos/asheville.jpg",
  tulum: "/photos/tulum.jpg",
};

export function tripPhoto(place: string) {
  const words = place.toLowerCase().split(/[^a-z]+/);
  const key = Object.keys(PHOTOS).find((k) => words.includes(k));
  return key ? PHOTOS[key] : null;
}
