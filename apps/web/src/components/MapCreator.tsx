"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map } from "maplibre-gl";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import AddressSearch from "./AddressSearch";
import { searchAddress } from "@/lib/stadiaGeocode";
import {
  INITIAL_MAP_CONFIG,
  type HazardType,
  type MapConfig,
} from "@/types/mapConfig";
import styles from "./MapCreator.module.css";

const STADIA_STYLE_BASE =
  "https://tiles.stadiamaps.com/styles/alidade_smooth.json";

const DEFAULT_DATA_BASE = "http://127.0.0.1:8080";

// Flood level 仮色（正式デザインではない。Style側のみで色を持つ）
const FLOOD_FILL_COLOR = [
  "match",
  ["get", "level"],
  "0m-0.5m",
  "#c6dbef",
  "0.5m-3m",
  "#6baed6",
  "3m-5m",
  "#3182bd",
  "5m-10m",
  "#08519c",
  "10m-20m",
  "#08306b",
  "20m+",
  "#041c3a",
  "#9ecae1",
] as const;

type HazardDef = {
  sourceId: string;
  sourceLayer: string;
  file: string;
  fillPaint: Record<string, unknown>;
  linePaint: Record<string, unknown>;
};

const HAZARD_DEFS: Record<Exclude<HazardType, "none">, HazardDef> = {
  flood: {
    sourceId: "flood",
    sourceLayer: "flood",
    file: "flood.pmtiles",
    fillPaint: {
      "fill-color": [...FLOOD_FILL_COLOR],
      "fill-opacity": 0.55,
    },
    linePaint: {
      "line-color": "#08519c",
      "line-width": 0.5,
      "line-opacity": 0.65,
    },
  },
  landslide: {
    sourceId: "landslide",
    sourceLayer: "landslide",
    file: "landslide.pmtiles",
    fillPaint: {
      "fill-color": "#c47b2d",
      "fill-opacity": 0.45,
    },
    linePaint: {
      "line-color": "#8a5418",
      "line-width": 0.6,
      "line-opacity": 0.7,
    },
  },
  tsunami: {
    sourceId: "tsunami",
    sourceLayer: "tsunami",
    file: "tsunami.pmtiles",
    fillPaint: {
      "fill-color": "#2a6fdb",
      "fill-opacity": 0.45,
    },
    linePaint: {
      "line-color": "#1a4fa0",
      "line-width": 0.6,
      "line-opacity": 0.7,
    },
  },
};

let pmtilesProtocolRegistered = false;

function ensurePmtilesProtocol() {
  if (pmtilesProtocolRegistered) return;
  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
  pmtilesProtocolRegistered = true;
}

function dataBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_HAZARD_DATA_BASE_URL?.replace(/\/$/, "") ||
    DEFAULT_DATA_BASE
  );
}

function stadiaStyleUrl() {
  const key = process.env.NEXT_PUBLIC_STADIA_API_KEY;
  if (!key) return STADIA_STYLE_BASE;
  const url = new URL(STADIA_STYLE_BASE);
  url.searchParams.set("api_key", key);
  return url.toString();
}

function firstSymbolLayerId(map: Map) {
  const layers = map.getStyle()?.layers || [];
  return layers.find((layer) => layer.type === "symbol")?.id;
}

export default function MapCreator() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const homeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const overlaysReadyRef = useRef(false);

  const [mapConfig, setMapConfig] = useState<MapConfig>(INITIAL_MAP_CONFIG);

  // Transient UI / Runtime State（MapConfig には入れない）
  const [addressInput, setAddressInput] = useState("");
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [status, setStatus] = useState("initializing…");
  const [error, setError] = useState<string | null>(null);

  const mapConfigRef = useRef(mapConfig);
  mapConfigRef.current = mapConfig;

  // Map init once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    ensurePmtilesProtocol();

    const base = dataBaseUrl();
    const tileBase = `${base}/data/tiles/hyogo`;
    const shelterUrl = `${base}/data/processed/hyogo/shelter.geojson`;
    const initial = INITIAL_MAP_CONFIG;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: stadiaStyleUrl(),
      center: [initial.mapView.centerLng, initial.mapView.centerLat],
      zoom: initial.mapView.zoom,
      minZoom: 11,
      maxZoom: 14,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    const onError = (event: { error?: { message?: string } | Error }) => {
      const msg =
        (event.error && "message" in event.error && event.error.message) ||
        String(event.error || event);
      console.error(msg);
      setError((prev) => (prev ? `${prev}\n${msg}` : msg));
    };
    map.on("error", onError);

    const homeEl = document.createElement("div");
    homeEl.className = styles.homeMarker;
    homeEl.title = "Home";
    homeMarkerRef.current = new maplibregl.Marker({ element: homeEl })
      .setLngLat([initial.location.lng, initial.location.lat])
      .addTo(map);

    const addHazardLayers = (beforeId?: string) => {
      for (const [key, def] of Object.entries(HAZARD_DEFS)) {
        if (!map.getSource(def.sourceId)) {
          map.addSource(def.sourceId, {
            type: "vector",
            url: `pmtiles://${tileBase}/${def.file}`,
            minzoom: 11,
            maxzoom: 14,
          });
        }

        const fillId = `${key}-fill`;
        const outlineId = `${key}-outline`;
        if (!map.getLayer(fillId)) {
          map.addLayer(
            {
              id: fillId,
              type: "fill",
              source: def.sourceId,
              "source-layer": def.sourceLayer,
              layout: { visibility: "none" },
              paint: def.fillPaint as never,
            },
            beforeId
          );
        }
        if (!map.getLayer(outlineId)) {
          map.addLayer(
            {
              id: outlineId,
              type: "line",
              source: def.sourceId,
              "source-layer": def.sourceLayer,
              layout: { visibility: "none" },
              paint: def.linePaint as never,
            },
            beforeId
          );
        }
      }
    };

    const addShelterLayer = async () => {
      try {
        const res = await fetch(shelterUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const geojson = await res.json();
        if (!map.getSource("shelter")) {
          map.addSource("shelter", { type: "geojson", data: geojson });
        }
        if (!map.getLayer("shelter-circle")) {
          map.addLayer({
            id: "shelter-circle",
            type: "circle",
            source: "shelter",
            paint: {
              "circle-radius": 4,
              "circle-color": "#1b7f4a",
              "circle-stroke-width": 1,
              "circle-stroke-color": "#ffffff",
              "circle-opacity": 0.9,
            },
          });
        }
        return (geojson.features?.length as number | undefined) ?? 0;
      } catch (err) {
        const msg = `Shelter GeoJSON読込失敗: ${
          err instanceof Error ? err.message : String(err)
        }`;
        console.error(msg);
        setError((prev) => (prev ? `${prev}\n${msg}` : msg));
        return 0;
      }
    };

    const applyHazardVisibility = (selected: HazardType) => {
      for (const key of Object.keys(HAZARD_DEFS)) {
        const visible = selected === key ? "visible" : "none";
        if (map.getLayer(`${key}-fill`)) {
          map.setLayoutProperty(`${key}-fill`, "visibility", visible);
        }
        if (map.getLayer(`${key}-outline`)) {
          map.setLayoutProperty(`${key}-outline`, "visibility", visible);
        }
      }
    };

    const applyShelterVisibility = (show: boolean) => {
      if (map.getLayer("shelter-circle")) {
        map.setLayoutProperty(
          "shelter-circle",
          "visibility",
          show ? "visible" : "none"
        );
      }
    };

    let cancelled = false;
    let setupStarted = false;

    const setupOverlays = async () => {
      if (cancelled || !mapRef.current || setupStarted) return;
      setupStarted = true;
      try {
        const beforeId = firstSymbolLayerId(map);
        if (cancelled) return;
        addHazardLayers(beforeId);
        const shelterCount = await addShelterLayer();
        if (cancelled || !mapRef.current) return;

        overlaysReadyRef.current = true;
        const cfg = mapConfigRef.current;
        applyHazardVisibility(cfg.hazardLayer);
        applyShelterVisibility(cfg.shelterVisible);
        setStatus(
          `ready | data=${base} | shelter=${shelterCount} | z=${map
            .getZoom()
            .toFixed(1)}`
        );
      } catch (err) {
        if (cancelled) return;
        const msg = `Overlay setup failed: ${
          err instanceof Error ? err.message : String(err)
        }`;
        console.error(msg);
        setError((prev) => (prev ? `${prev}\n${msg}` : msg));
      }
    };

    map.once("load", () => {
      void setupOverlays();
    });
    map.once("style.load", () => {
      void setupOverlays();
    });

    // pan / zoom 完了時のみ mapView を同期（location は変えない）
    const onMoveEnd = () => {
      if (cancelled) return;
      const center = map.getCenter();
      setMapConfig((prev) => ({
        ...prev,
        mapView: {
          centerLat: center.lat,
          centerLng: center.lng,
          zoom: map.getZoom(),
        },
      }));
    };
    map.on("moveend", onMoveEnd);

    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __hazardMap?: Map }).__hazardMap = map;
    }

    requestAnimationFrame(() => {
      if (!cancelled && mapRef.current === map) map.resize();
    });

    const kickRender = () => {
      if (cancelled || mapRef.current !== map) return;
      map.triggerRepaint();
      if (map.loaded() && overlaysReadyRef.current) {
        window.clearInterval(kickId);
      }
    };
    const kickId = window.setInterval(kickRender, 250);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        map.resize();
        kickRender();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      overlaysReadyRef.current = false;
      window.clearInterval(kickId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      map.off("moveend", onMoveEnd);
      homeMarkerRef.current?.remove();
      homeMarkerRef.current = null;
      map.off("error", onError);
      if (process.env.NODE_ENV === "development") {
        const w = window as unknown as { __hazardMap?: Map };
        if (w.__hazardMap === map) delete w.__hazardMap;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Hazard visibility from MapConfig
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !overlaysReadyRef.current) return;
    for (const key of Object.keys(HAZARD_DEFS)) {
      const visible = mapConfig.hazardLayer === key ? "visible" : "none";
      if (map.getLayer(`${key}-fill`)) {
        map.setLayoutProperty(`${key}-fill`, "visibility", visible);
      }
      if (map.getLayer(`${key}-outline`)) {
        map.setLayoutProperty(`${key}-outline`, "visibility", visible);
      }
    }
  }, [mapConfig.hazardLayer]);

  // Shelter visibility from MapConfig
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !overlaysReadyRef.current) return;
    if (map.getLayer("shelter-circle")) {
      map.setLayoutProperty(
        "shelter-circle",
        "visibility",
        mapConfig.shelterVisible ? "visible" : "none"
      );
    }
  }, [mapConfig.shelterVisible]);

  // Dev: MapConfig を確認用に公開（本番向けUIではない）
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    (window as unknown as { __mapConfig?: MapConfig }).__mapConfig = mapConfig;
  }, [mapConfig]);

  const handleAddressSearch = async () => {
    if (geocodingLoading) return;
    setGeocodingError(null);
    setGeocodingLoading(true);

    try {
      const result = await searchAddress(addressInput);
      if (!result.ok) {
        if (result.error.kind === "empty") {
          setGeocodingError("住所を入力してください。");
        } else if (result.error.kind === "no_result") {
          setGeocodingError(
            "住所が見つかりませんでした。\n住所を確認してもう一度お試しください。"
          );
        } else {
          setGeocodingError(
            "住所検索に失敗しました。\n時間をおいてもう一度お試しください。"
          );
        }
        return;
      }

      const { location, label } = result.value;
      const map = mapRef.current;

      setMapConfig((prev) => ({
        ...prev,
        location: {
          address: label,
          lat: location.lat,
          lng: location.lng,
        },
        mapView: {
          ...prev.mapView,
          centerLat: location.lat,
          centerLng: location.lng,
          zoom: 13,
        },
      }));

      if (map) {
        map.flyTo({
          center: [location.lng, location.lat],
          zoom: 13,
        });
      }
      homeMarkerRef.current?.setLngLat([location.lng, location.lat]);
      setGeocodingError(null);
    } finally {
      setGeocodingLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <aside className={styles.panel}>
        <h1>MAP CREATOR</h1>

        <h2>LOCATION</h2>
        <AddressSearch
          addressInput={addressInput}
          currentAddress={mapConfig.location.address}
          loading={geocodingLoading}
          error={geocodingError}
          onAddressChange={setAddressInput}
          onSubmit={() => {
            void handleAddressSearch();
          }}
        />

        <h2>HAZARD</h2>
        {(
          [
            ["none", "None"],
            ["flood", "Flood"],
            ["landslide", "Landslide"],
            ["tsunami", "Tsunami"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className={styles.option}>
            <input
              type="radio"
              name="hazard"
              value={value}
              checked={mapConfig.hazardLayer === value}
              onChange={() =>
                setMapConfig((prev) => ({
                  ...prev,
                  hazardLayer: value,
                }))
              }
            />
            {label}
          </label>
        ))}

        <h2>SHELTER</h2>
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={mapConfig.shelterVisible}
            onChange={(event) =>
              setMapConfig((prev) => ({
                ...prev,
                shelterVisible: event.target.checked,
              }))
            }
          />
          Show shelters
        </label>

        <div className={styles.status} data-error={error ? "true" : "false"}>
          {error
            ? error
            : `${status} | home=${mapConfig.location.lng.toFixed(5)},${mapConfig.location.lat.toFixed(5)} | view=${mapConfig.mapView.centerLng.toFixed(5)},${mapConfig.mapView.centerLat.toFixed(5)} z=${mapConfig.mapView.zoom.toFixed(2)}`}
        </div>
      </aside>
      <div ref={mapContainerRef} className={styles.map} />
    </div>
  );
}
