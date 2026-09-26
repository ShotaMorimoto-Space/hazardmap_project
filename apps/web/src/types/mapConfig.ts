/**
 * MapConfig — 1枚の地図の設計図（Validation 現時点）
 *
 * location = ユーザーの自宅位置（Home Marker）
 * mapView  = 現在表示している地図の中心・zoom（pan/zoomで変化し得る）
 * title / titleVisible = 商品タイトル（Preview Overlay）
 *
 * 未実装のためまだ含めない: layout / mapStyle / familyPlaces
 */

export type HazardType = "none" | "flood" | "landslide" | "tsunami";

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
  hazardLayer: "flood",
  shelterVisible: true,
  title: "わたしたちのまち",
  titleVisible: true,
};

/** Title input max length（runtime validation と揃える） */
export const MAP_TITLE_MAX_LENGTH = 80;
