#!/usr/bin/env python3
"""兵庫県の公的ハザード・避難所データを取得し、共通GeoJSONへ変換する。"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import tempfile
import urllib.request
import zipfile
from collections.abc import Callable, Iterable, Iterator
from pathlib import Path
from typing import Any, BinaryIO

import ijson
import shapefile
from pyproj import Transformer


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw" / "hyogo"
PROCESSED_DIR = ROOT / "data" / "processed" / "hyogo"

SOURCES = {
    "flood": {
        "url": "https://nlftp.mlit.go.jp/ksj/gml/data/A31a/A31a-25/A31a-25_28_10_GEOJSON.zip",
        "path": RAW_DIR / "flood" / "A31a-25_28_10_GEOJSON.zip",
    },
    "landslide": {
        "url": "https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_28_GEOJSON.zip",
        "path": RAW_DIR / "landslide" / "A33-25_28_GEOJSON.zip",
    },
    "tsunami": [
        {
            "url": "https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-18/A40-18_28_GML.zip",
            "path": RAW_DIR / "tsunami" / "A40-18_28_GML.zip",
        },
        {
            "url": "https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-16/A40-16_28_GML.zip",
            "path": RAW_DIR / "tsunami" / "A40-16_28_GML.zip",
        },
    ],
    "shelter_csv": [
        {
            "url": "https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/28000_1.csv",
            "path": RAW_DIR / "shelter" / "28000_1.csv",
        },
        {
            "url": "https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/28000_2.csv",
            "path": RAW_DIR / "shelter" / "28000_2.csv",
        },
    ],
    "shelter": [
        {
            "url": "https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/geoJSON/28000_1.geojson",
            "path": RAW_DIR / "shelter" / "28000_1.geojson",
        },
        {
            "url": "https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/geoJSON/28000_2.geojson",
            "path": RAW_DIR / "shelter" / "28000_2.geojson",
        },
        {
            "url": (
                "https://hinanmap.gsi.go.jp/hinanjocp/assets/notice/"
                "%E3%81%94%E5%88%A9%E7%94%A8%E4%B8%8A%E3%81%AE%E6%B3%A8%E6%84%8F.txt"
            ),
            "path": RAW_DIR / "shelter" / "ご利用上の注意.txt",
        },
    ],
}

FLOOD_DEPTH_LEVELS = {
    1: "0m-0.5m",
    2: "0.5m-3m",
    3: "3m-5m",
    4: "5m-10m",
    5: "10m-20m",
    6: "20m+",
}

LANDSLIDE_CATEGORIES = {
    1: "steep_slope_failure",
    2: "debris_flow",
    3: "landslide",
}

LANDSLIDE_ZONES = {
    1: "warning_zone",
    2: "special_warning_zone",
    3: "warning_zone_before_designation",
    4: "special_warning_zone_before_designation",
}

SHELTER_DISASTER_FIELDS = {
    "洪水": "flood",
    "崖崩れ、土石流及び地滑り": "landslide",
    "高潮": "storm_surge",
    "地震": "earthquake",
    "津波": "tsunami",
    "大規模な火事": "large_fire",
    "内水氾濫": "inland_flood",
    "火山現象": "volcanic_phenomenon",
}


def download_file(url: str, destination: Path) -> None:
    """配布ファイルを一時ファイル経由で保存する。既存ファイルは上書きする。"""
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "hazardmap-project-validation/1.0"},
    )
    with urllib.request.urlopen(request) as response:
        with tempfile.NamedTemporaryFile(
            dir=destination.parent, delete=False
        ) as temporary:
            shutil.copyfileobj(response, temporary)
            temporary_path = Path(temporary.name)
    temporary_path.replace(destination)
    print(f"downloaded: {destination.relative_to(ROOT)}")


def download_raw_data(datasets: set[str]) -> None:
    for dataset in datasets:
        entries = SOURCES[dataset]
        if isinstance(entries, dict):
            entries = [entries]
        for entry in entries:
            download_file(entry["url"], entry["path"])
        if dataset == "shelter":
            for entry in SOURCES["shelter_csv"]:
                download_file(entry["url"], entry["path"])


def zip_geojson_members(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as archive:
        return [
            info.filename
            for info in archive.infolist()
            if info.filename.lower().endswith(".geojson")
        ]


def iter_geojson_features(stream: BinaryIO) -> Iterator[dict[str, Any]]:
    yield from ijson.items(stream, "features.item", use_float=True)


def iter_file_features(path: Path) -> Iterator[dict[str, Any]]:
    with path.open("rb") as stream:
        yield from iter_geojson_features(stream)


def iter_zip_features(
    path: Path, members: Iterable[str]
) -> Iterator[tuple[str, dict[str, Any]]]:
    with zipfile.ZipFile(path) as archive:
        for member in members:
            with archive.open(member) as stream:
                for feature in iter_geojson_features(stream):
                    yield member, feature


def iter_zip_shapefile_features(
    path: Path, stem: str
) -> Iterator[dict[str, Any]]:
    """ZIP内のShapefileを展開せず、1地物ずつGeoJSON Featureとして読む。"""
    with zipfile.ZipFile(path) as archive:
        with (
            archive.open(f"{stem}.shp") as shp,
            archive.open(f"{stem}.shx") as shx,
            archive.open(f"{stem}.dbf") as dbf,
        ):
            reader = shapefile.Reader(
                shp=shp,
                shx=shx,
                dbf=dbf,
                encoding="cp932",
            )
            for shape_record in reader.iterShapeRecords():
                yield {
                    "type": "Feature",
                    "properties": shape_record.record.as_dict(),
                    "geometry": shape_record.shape.__geo_interface__,
                }


class GeometryTransformer:
    def __init__(self, source_epsg: int) -> None:
        self.transformer = Transformer.from_crs(
            source_epsg, 4326, always_xy=True
        )
        self.bounds = [float("inf"), float("inf"), float("-inf"), float("-inf")]

    def transform_coordinates(self, coordinates: Any) -> Any:
        if (
            isinstance(coordinates, (list, tuple))
            and len(coordinates) >= 2
            and isinstance(coordinates[0], (int, float))
            and isinstance(coordinates[1], (int, float))
        ):
            longitude, latitude = self.transformer.transform(
                coordinates[0], coordinates[1]
            )
            self.bounds[0] = min(self.bounds[0], longitude)
            self.bounds[1] = min(self.bounds[1], latitude)
            self.bounds[2] = max(self.bounds[2], longitude)
            self.bounds[3] = max(self.bounds[3], latitude)
            return [longitude, latitude, *coordinates[2:]]
        return [self.transform_coordinates(item) for item in coordinates]

    def transform(self, geometry: dict[str, Any]) -> dict[str, Any]:
        transformed = dict(geometry)
        transformed["coordinates"] = self.transform_coordinates(
            geometry["coordinates"]
        )
        return transformed


def write_feature_collection(
    path: Path,
    name: str,
    features: Iterable[dict[str, Any]],
    source_epsg: int,
    expected_geometry_types: set[str],
) -> dict[str, Any]:
    """RFC 7946準拠のFeatureCollectionをメモリに全件保持せず出力する。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    transformer = GeometryTransformer(source_epsg)
    geometry_counts: dict[str, int] = {}
    count = 0

    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=path.parent,
        delete=False,
    ) as temporary:
        temporary_path = Path(temporary.name)
        temporary.write(
            json.dumps(
                {"type": "FeatureCollection", "name": name},
                ensure_ascii=False,
                separators=(",", ":"),
            )[:-1]
        )
        temporary.write(',"features":[')
        first = True
        for feature in features:
            geometry = feature.get("geometry")
            if not geometry:
                raise ValueError(f"{name}: geometryがないFeatureがあります")
            geometry_type = geometry.get("type")
            if geometry_type not in expected_geometry_types:
                raise ValueError(
                    f"{name}: 想定外のgeometry type: {geometry_type}"
                )
            feature["geometry"] = transformer.transform(geometry)
            if not first:
                temporary.write(",")
            json.dump(
                feature,
                temporary,
                ensure_ascii=False,
                separators=(",", ":"),
                allow_nan=False,
            )
            first = False
            count += 1
            geometry_counts[geometry_type] = geometry_counts.get(geometry_type, 0) + 1
        temporary.write("]}")

    temporary_path.replace(path)
    if count == 0:
        raise ValueError(f"{name}: Featureが0件です")
    bounds = transformer.bounds
    if not (
        130 <= bounds[0] <= 136
        and 33 <= bounds[1] <= 37
        and 130 <= bounds[2] <= 136
        and 33 <= bounds[3] <= 37
    ):
        raise ValueError(f"{name}: 兵庫県周辺外の座標を検出しました: {bounds}")
    return {
        "features": count,
        "geometry_types": geometry_counts,
        "bounds": bounds,
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
    }


def normalize_flood() -> Iterator[dict[str, Any]]:
    path = SOURCES["flood"]["path"]
    for member, feature in iter_zip_features(path, zip_geojson_members(path)):
        properties = feature.get("properties") or {}
        if "A31a-10-" in member:
            scenario = "planned_scale"
            category = "inundation_depth"
            keys = ("A31a_101", "A31a_102", "A31a_103", "A31a_104", "A31a_105")
        elif "A31a-20-" in member:
            scenario = "maximum_expected"
            category = "inundation_depth"
            keys = ("A31a_201", "A31a_202", "A31a_203", "A31a_204", "A31a_205")
        elif "A31a-41-" in member:
            scenario = "maximum_expected"
            category = "house_collapse_inundation_flow"
            keys = ("A31a_401", "A31a_402", "A31a_403", "A31a_404", "A31a_405")
        elif "A31a-42-" in member:
            scenario = "maximum_expected"
            category = "house_collapse_bank_erosion"
            keys = ("A31a_401", "A31a_402", "A31a_403", "A31a_404", "A31a_405")
        else:
            raise ValueError(f"未対応の洪水レイヤーです: {member}")
        river_code, river_name, manager_code, manager, rank = (
            properties.get(key) for key in keys
        )
        normalized = {
            "hazard_type": "flood",
            "source": "MLIT",
            "scenario": scenario,
            "category": category,
            "level": FLOOD_DEPTH_LEVELS.get(rank) if category == "inundation_depth" else None,
            "river_code": river_code,
            "river_name": river_name,
            "river_manager_code": manager_code,
            "river_manager": manager,
            "depth_rank": rank if category == "inundation_depth" else None,
            "danger_zone_code": rank if category != "inundation_depth" else None,
            **properties,
        }
        feature["properties"] = normalized
        yield feature


def normalize_landslide() -> Iterator[dict[str, Any]]:
    path = SOURCES["landslide"]["path"]
    members = zip_geojson_members(path)
    for _, feature in iter_zip_features(path, members):
        properties = feature.get("properties") or {}
        category_code = properties.get("A33_001")
        zone_code = properties.get("A33_002")
        feature["properties"] = {
            "hazard_type": "landslide",
            "source": "MLIT",
            "category": LANDSLIDE_CATEGORIES.get(category_code),
            "category_code": category_code,
            "zone_type": LANDSLIDE_ZONES.get(zone_code),
            "zone_code": zone_code,
            "prefecture_code": properties.get("A33_003"),
            "zone_number": properties.get("A33_004"),
            "zone_name": properties.get("A33_005"),
            "address": properties.get("A33_006"),
            "announcement_date": properties.get("A33_007"),
            "special_zone_not_designated": properties.get("A33_008"),
            **properties,
        }
        yield feature


def normalize_tsunami() -> Iterator[dict[str, Any]]:
    sources = SOURCES["tsunami"]
    feature_sets = [
        (
            "2018",
            iter_zip_features(
                sources[0]["path"],
                ["A40-18_28.geojson"],
            ),
        ),
        (
            "2016",
            (
                ("A40-16_28.shp", feature)
                for feature in iter_zip_shapefile_features(
                    sources[1]["path"],
                    "A40-16_28",
                )
            ),
        ),
    ]
    for data_year, feature_set in feature_sets:
        for _, feature in feature_set:
            properties = feature.get("properties") or {}
            feature["properties"] = {
                "hazard_type": "tsunami",
                "source": "MLIT",
                "data_year": data_year,
                "level": properties.get("A40_003"),
                "prefecture_name": properties.get("A40_001"),
                "prefecture_code": properties.get("A40_002"),
                **properties,
            }
            yield feature


def normalize_shelter() -> Iterator[dict[str, Any]]:
    sources = [
        (RAW_DIR / "shelter" / "28000_1.geojson", "designated_shelter"),
        (RAW_DIR / "shelter" / "28000_2.geojson", "emergency_evacuation_site"),
    ]
    for path, shelter_type in sources:
        for feature in iter_file_features(path):
            properties = feature.get("properties") or {}
            disaster_types = (
                [
                    normalized_name
                    for source_name, normalized_name in SHELTER_DISASTER_FIELDS.items()
                    if str(properties.get(source_name) or "").strip() == "1"
                ]
                if shelter_type == "emergency_evacuation_site"
                else []
            )
            feature["properties"] = {
                "hazard_type": "shelter",
                "source": "GSI",
                "shelter_type": shelter_type,
                "name": properties.get("施設・場所名"),
                "address": properties.get("住所"),
                "common_id": properties.get("共通ID"),
                "disaster_types": disaster_types,
                **properties,
            }
            yield feature


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_raw_files(datasets: set[str]) -> None:
    missing: list[Path] = []
    for dataset in datasets:
        entries = SOURCES[dataset]
        if isinstance(entries, dict):
            entries = [entries]
        missing.extend(entry["path"] for entry in entries if not entry["path"].exists())
    if missing:
        formatted = "\n".join(f"- {path.relative_to(ROOT)}" for path in missing)
        raise FileNotFoundError(
            f"原本がありません。--download を付けて再実行してください:\n{formatted}"
        )


def process(datasets: set[str]) -> dict[str, Any]:
    processors: dict[
        str,
        tuple[
            Callable[[], Iterator[dict[str, Any]]],
            int,
            set[str],
        ],
    ] = {
        "flood": (normalize_flood, 6668, {"Polygon", "MultiPolygon"}),
        "landslide": (normalize_landslide, 6668, {"Polygon", "MultiPolygon"}),
        "tsunami": (normalize_tsunami, 6668, {"Polygon", "MultiPolygon"}),
        "shelter": (normalize_shelter, 4326, {"Point"}),
    }
    report: dict[str, Any] = {}
    for dataset in ("flood", "landslide", "tsunami", "shelter"):
        if dataset not in datasets:
            continue
        normalizer, source_epsg, geometry_types = processors[dataset]
        output = PROCESSED_DIR / f"{dataset}.geojson"
        print(f"processing: {dataset}", flush=True)
        report[dataset] = write_feature_collection(
            output,
            f"hyogo_{dataset}",
            normalizer(),
            source_epsg,
            geometry_types,
        )
        print(json.dumps({dataset: report[dataset]}, ensure_ascii=False), flush=True)
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--download",
        action="store_true",
        help="公式配布元からrawデータを再取得してから変換する",
    )
    parser.add_argument(
        "--dataset",
        action="append",
        choices=("flood", "landslide", "tsunami", "shelter"),
        help="対象を限定する（複数回指定可、未指定時は4種類すべて）",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    datasets = set(args.dataset or ("flood", "landslide", "tsunami", "shelter"))
    try:
        if args.download:
            download_raw_data(datasets)
        ensure_raw_files(datasets)
        report = process(datasets)
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
