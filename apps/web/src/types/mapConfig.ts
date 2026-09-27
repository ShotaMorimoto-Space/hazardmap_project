/**
 * MapConfig — 1枚の地図の設計図（Validation 現時点）
 *
 * location = ユーザーの自宅位置（Home Marker）
 * mapView  = 現在表示している地図の中心・zoom（pan/zoomで変化し得る）
 * layout   = ポスター上の地図／タイトル配置
 * title / titleVisible = 商品タイトル（Preview Overlay / 下部領域）
 *
 * 未実装のためまだ含めない: mapStyle / familyPlaces / A1・A2
 */

export type HazardType = "none" | "flood" | "landslide" | "tsunami";

export type MapLayout = "full-map" | "bottom-title";

export type MapConfig = {
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  mapView: {
    centerLat: number;
    centerLng: number;
    zoom: number;
  };
  layout: MapLayout;
  hazardLayer: HazardType;
  shelterVisible: boolean;
  title: string;
  titleVisible: boolean;
};

export const INITIAL_MAP_CONFIG: MapConfig = {
  location: {
    address: "兵庫県伊丹市（Validation）",
    lat: 34.78,
    lng: 135.4,
  },
  mapView: {
    centerLat: 34.78,
    centerLng: 135.4,
    zoom: 13,
  },
  layout: "full-map",
  hazardLayer: "flood",
  shelterVisible: true,
  title: "わたしたちのまち",
  titleVisible: true,
};

/** Title input max length（runtime validation と揃える） */
export const MAP_TITLE_MAX_LENGTH = 80;
