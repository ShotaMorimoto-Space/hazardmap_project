/**
 * MapConfig localStorage draft persistence（Validation）
 *
 * SSR-safe: module top-level で window / localStorage を触らない。
 * 壊れたデータ・不明 version は INITIAL_MAP_CONFIG へ fallback。
 * Storage v1 → v2: title / titleVisible を補完して Migration。
 */

import {
  INITIAL_MAP_CONFIG,
  MAP_TITLE_MAX_LENGTH,
  type HazardType,
  type MapConfig,
} from "@/types/mapConfig";

export const MAP_CONFIG_STORAGE_KEY = "hazardmap.map-config";

export const MAP_CONFIG_STORAGE_VERSION = 2 as const;

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

function isValidTitle(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAP_TITLE_MAX_LENGTH;
}

/** v1 / v2 共通の core fields（title なし） */
function isMapConfigCore(value: unknown): boolean {
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
  if (
    !isFiniteNumber(view.centerLat) ||
    view.centerLat < -90 ||
    view.centerLat > 90
  ) {
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

/** Storage v1 の MapConfig（title / titleVisible なし） */
export function isMapConfigV1(value: unknown): boolean {
  return isMapConfigCore(value);
}

/** Storage v2 の MapConfig（現在の正式 shape） */
export function isMapConfig(value: unknown): value is MapConfig {
  if (!isMapConfigCore(value)) return false;
  const cfg = value as Record<string, unknown>;
  if (!isValidTitle(cfg.title)) return false;
  if (typeof cfg.titleVisible !== "boolean") return false;
  return true;
}

function migrateV1ToV2(v1: Record<string, unknown>): MapConfig {
  return {
    location: v1.location as MapConfig["location"],
    mapView: v1.mapView as MapConfig["mapView"],
    hazardLayer: v1.hazardLayer as HazardType,
    shelterVisible: v1.shelterVisible as boolean,
    title: INITIAL_MAP_CONFIG.title,
    titleVisible: INITIAL_MAP_CONFIG.titleVisible,
  };
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * localStorage から MapConfig を読む。
 * - version 2 + valid → そのまま
 * - version 1 + valid core → title 補完して v2
 * - 欠損・破損・不正 shape・不明 version → INITIAL_MAP_CONFIG
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

    // v2
    if (stored.version === MAP_CONFIG_STORAGE_VERSION) {
      if (!isMapConfig(stored.mapConfig)) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[mapConfigStorage] invalid mapConfig shape (v2); using INITIAL_MAP_CONFIG"
          );
        }
        return INITIAL_MAP_CONFIG;
      }
      return stored.mapConfig;
    }

    // v1 → v2 migration（既存 Draft を捨てない）
    if (stored.version === 1) {
      if (!isMapConfigV1(stored.mapConfig)) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[mapConfigStorage] invalid mapConfig shape (v1); using INITIAL_MAP_CONFIG"
          );
        }
        return INITIAL_MAP_CONFIG;
      }
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[mapConfigStorage] migrating storage v1 → v2 (title / titleVisible)"
        );
      }
      return migrateV1ToV2(stored.mapConfig as Record<string, unknown>);
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[mapConfigStorage] unsupported version ${String(stored.version)}; using INITIAL_MAP_CONFIG`
      );
    }
    return INITIAL_MAP_CONFIG;
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
