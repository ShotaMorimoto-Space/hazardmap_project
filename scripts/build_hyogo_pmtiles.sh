#!/usr/bin/env bash
# 兵庫県ハザード processed GeoJSON → Vector PMTiles（表示専用）
#
# 公的ハザード区域の基準データは data/processed/hyogo/*.geojson。
# PMTiles は MapLibre 表示最適化用。色は焼き込まない。
#
# 方針:
# - Feature を意図的に drop しない（--drop-* を使わない）
# - 属性の異なる Polygon を coalesce しない（--coalesce-* を使わない）
# - 不要属性は --include で絞り Tile サイズを抑える
# - Validation で使う zoom（既定 11–14）では区域欠落を避ける
# - 低ズームの全域俯瞰タイルは作らず、minzoom から配信する
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INPUT_DIR="$ROOT/data/processed/hyogo"
OUTPUT_DIR="$ROOT/data/tiles/hyogo"

# Validation / 自宅周辺表示で使う想定 zoom
MIN_ZOOM="${MIN_ZOOM:-11}"
MAX_ZOOM="${MAX_ZOOM:-14}"

mkdir -p "$OUTPUT_DIR"

if ! command -v tippecanoe >/dev/null 2>&1; then
  echo "error: tippecanoe が必要です。例: brew install tippecanoe" >&2
  exit 1
fi

build_one() {
  local name="$1"
  shift
  local input="$INPUT_DIR/${name}.geojson"
  local output="$OUTPUT_DIR/${name}.pmtiles"
  local log="$OUTPUT_DIR/${name}.tippecanoe.log"

  if [[ ! -f "$input" ]]; then
    echo "error: 入力がありません: $input" >&2
    exit 1
  fi

  echo "building: $name (z${MIN_ZOOM}-${MAX_ZOOM}, no drop / no coalesce)"
  # ログに "drop" / "Keeping the sparsest" が出ないことを確認できるように保存する
  tippecanoe \
    -o "$output" \
    -f \
    -l "$name" \
    -Z "$MIN_ZOOM" \
    -z "$MAX_ZOOM" \
    --simplify-only-low-zooms \
    --no-tiny-polygon-reduction-at-maximum-zoom \
    --detect-shared-borders \
    --no-feature-limit \
    --no-tile-size-limit \
    "$@" \
    "$input" 2>&1 | tee "$log"

  if rg -n "Going to try keeping the sparsest|drop densest|Dropped|dropped .* features" "$log" >/dev/null; then
    echo "warning: tippecanoe log suggests feature dropping for $name" >&2
  else
    echo "ok: no feature-drop messages in $log"
  fi

  ls -lh "$output"
}

# Flood: 浸水深・シナリオ等の主要属性のみ保持
build_one flood \
  --include=hazard_type \
  --include=scenario \
  --include=category \
  --include=level \
  --include=depth_rank \
  --include=river_name \
  --include=river_code \
  --include=danger_zone_code

# Landslide: 現象種別・区域区分
build_one landslide \
  --include=hazard_type \
  --include=category \
  --include=category_code \
  --include=zone_type \
  --include=zone_code \
  --include=zone_name \
  --include=zone_number \
  --include=prefecture_code

# Tsunami: 浸水深区分・整備年度
build_one tsunami \
  --include=hazard_type \
  --include=level \
  --include=data_year \
  --include=prefecture_code \
  --include=prefecture_name

echo "done: $OUTPUT_DIR (validation zoom ${MIN_ZOOM}-${MAX_ZOOM})"
