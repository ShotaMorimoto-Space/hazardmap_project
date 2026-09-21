/**
 * Stadia Forward Geocoding（Validation）
 *
 * Hazard Engine とは分離。座標取得のみを行い、区域判定は行わない。
 * 現在の Hazard / Shelter PMTiles は兵庫県のみのため、
 * 県外へ移動すると該当データが表示されない場合がある。
 */

export type HomeLocation = {
  lng: number;
  lat: number;
};

export type GeocodeSuccess = {
  location: HomeLocation;
  label: string;
};

export type GeocodeFailure =
  | { kind: "empty" }
  | { kind: "no_result" }
  | { kind: "api_error"; detail: string };

export type GeocodeResult =
  | { ok: true; value: GeocodeSuccess }
  | { ok: false; error: GeocodeFailure };

type StadiaFeature = {
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: {
    label?: unknown;
    name?: unknown;
  };
};

type StadiaSearchResponse = {
  features?: StadiaFeature[];
};

const GEOCODE_ENDPOINT = "https://api.stadiamaps.com/geocoding/v1/search";

function pickLabel(feature: StadiaFeature): string {
  const label = feature.properties?.label;
  if (typeof label === "string" && label.trim()) return label.trim();
  const name = feature.properties?.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return "（住所ラベルなし）";
}

function pickCoordinates(
  feature: StadiaFeature
): HomeLocation | null {
  const coords = feature.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lng = coords[0];
  const lat = coords[1];
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat };
}

export async function searchAddress(text: string): Promise<GeocodeResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: { kind: "empty" } };
  }

  const url = new URL(GEOCODE_ENDPOINT);
  url.searchParams.set("text", trimmed);
  url.searchParams.set("boundary.country", "JP");
  url.searchParams.set("lang", "ja");
  url.searchParams.set("size", "5");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("Stadia geocoding network error:", detail);
    return { ok: false, error: { kind: "api_error", detail } };
  }

  if (!response.ok) {
    const detail = `HTTP ${response.status}`;
    console.error("Stadia geocoding API error:", detail);
    return { ok: false, error: { kind: "api_error", detail } };
  }

  let data: StadiaSearchResponse;
  try {
    data = (await response.json()) as StadiaSearchResponse;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("Stadia geocoding JSON parse error:", detail);
    return { ok: false, error: { kind: "api_error", detail } };
  }

  const features = Array.isArray(data.features) ? data.features : [];
  if (features.length === 0) {
    return { ok: false, error: { kind: "no_result" } };
  }

  // Validation: 先頭候補を採用
  const feature = features[0];
  const location = pickCoordinates(feature);
  if (!location) {
    return {
      ok: false,
      error: { kind: "api_error", detail: "coordinates missing" },
    };
  }

  return {
    ok: true,
    value: {
      location,
      label: pickLabel(feature),
    },
  };
}
