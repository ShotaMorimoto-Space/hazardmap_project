/**
 * MapConfig localStorage draft persistence（Validation）
 *
 * SSR-safe: module top-level で window / localStorage を触らない。
 * 壊れたデータ・不明 version は INITIAL_MAP_CONFIG へ fallback。
 */

import {
  INITIAL_MAP_CONFIG,
  type HazardType,
  type MapConfig,
} from "@/types/mapConfig";

export const MAP_CONFIG_STORAGE_KEY = "hazardmap.map-config";

export const MAP_CONFIG_STORAGE_VERSION = 1 as const;

export type StoredMapConfig = {
  version: typeof MAP_CONFIG_STORAGE_VERSION;
  mapConfig: MapConfig;
};

const HAZARD_VALUES: readonly HazardType[] = [
  "none",
  "flood",
  "landslide",
  "tsunami",
];

const MIN_ZOOM = 11;
const MAX_ZOOM = 14;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isHazardType(value: unknown): value is HazardType {
  return (
    typeof value === "string" &&
    (HAZARD_VALUES as readonly string[]).includes(value)
  );
}

export function isMapConfig(value: unknown): value is MapConfig {
  if (!value || typeof value !== "object") return false;
  const cfg = value as Record<string, unknown>;

  const location = cfg.location;
  if (!location || typeof location !== "object") return false;
  const loc = location as Record<string, unknown>;
  if (typeof loc.address !== "string") return false;
  if (!isFiniteNumber(loc.lat) || loc.lat < -90 || loc.lat > 90) return false;
  if (!isFiniteNumber(loc.lng) || loc.lng < -180 || loc.lng > 180) return false;

  const mapView = cfg.mapView;
  if (!mapView || typeof mapView !== "object") return false;
  const view = mapView as Record<string, unknown>;
  if (!isFiniteNumber(view.centerLat) || view.centerLat < -90 || view.centerLat > 90) {
    return false;
  }
  if (
    !isFiniteNumber(view.centerLng) ||
    view.centerLng < -180 ||
    view.centerLng > 180
  ) {
    return false;
  }
  if (!isFiniteNumber(view.zoom) || view.zoom < MIN_ZOOM || view.zoom > MAX_ZOOM) {
    return false;
  }

  if (!isHazardType(cfg.hazardLayer)) return false;
  if (typeof cfg.shelterVisible !== "boolean") return false;

  return true;
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * localStorage から MapConfig を読む。
 * 欠損・破損・不正 shape・不明 version は INITIAL_MAP_CONFIG を返す。
 */
export function loadMapConfig(): MapConfig {
  if (!canUseLocalStorage()) return INITIAL_MAP_CONFIG;

  try {
    const raw = window.localStorage.getItem(MAP_CONFIG_STORAGE_KEY);
    if (raw == null) return INITIAL_MAP_CONFIG;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.warn("[mapConfigStorage] invalid JSON; using INITIAL_MAP_CONFIG");
      }
      return INITIAL_MAP_CONFIG;
    }

    if (!parsed || typeof parsed !== "object") {
      if (process.env.NODE_ENV === "development") {
        console.warn("[mapConfigStorage] non-object payload; using INITIAL_MAP_CONFIG");
      }
      return INITIAL_MAP_CONFIG;
    }

    const stored = parsed as Record<string, unknown>;
    if (stored.version !== MAP_CONFIG_STORAGE_VERSION) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[mapConfigStorage] unsupported version ${String(stored.version)}; using INITIAL_MAP_CONFIG`
        );
      }
      return INITIAL_MAP_CONFIG;
    }

    if (!isMapConfig(stored.mapConfig)) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[mapConfigStorage] invalid mapConfig shape; using INITIAL_MAP_CONFIG");
      }
      return INITIAL_MAP_CONFIG;
    }

    return stored.mapConfig;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[mapConfigStorage] load failed; using INITIAL_MAP_CONFIG", err);
    }
    return INITIAL_MAP_CONFIG;
  }
}

export function saveMapConfig(mapConfig: MapConfig): void {
  if (!canUseLocalStorage()) return;
  if (!isMapConfig(mapConfig)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[mapConfigStorage] refused to save invalid MapConfig");
    }
    return;
  }

  const payload: StoredMapConfig = {
    version: MAP_CONFIG_STORAGE_VERSION,
    mapConfig,
  };

  try {
    window.localStorage.setItem(MAP_CONFIG_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[mapConfigStorage] save failed", err);
    }
  }
}

/** Development / 手動確認用。UI には出さない。 */
export function clearMapConfig(): void {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(MAP_CONFIG_STORAGE_KEY);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[mapConfigStorage] clear failed", err);
    }
  }
}
