# 兵庫県ハザード・避難所データ

## 目的と範囲

Validation Release向けに、兵庫県の洪水、土砂災害、津波、避難所の公的データを取得し、共通属性を持つGeoJSONへ変換できることを検証した。

区域のgeometryは簡略化、結合、補正していない。加工は配布済み兵庫県データの選択、JGD2011からWGS 84への座標参照系変換、属性追加、GeoJSONへの統合に限定している。

## 再生成方法

Python 3.11以上を使用する。

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-data.txt

# 保存済みrawから4種類を再生成
.venv/bin/python scripts/prepare_hyogo_hazard_data.py

# 公式配布元からrawを再取得して再生成
.venv/bin/python scripts/prepare_hyogo_hazard_data.py --download

# 1種類だけ再生成する例
.venv/bin/python scripts/prepare_hyogo_hazard_data.py --dataset shelter
```

スクリプトは全Featureをメモリに展開せず処理する。出力中にgeometry type、件数、兵庫県周辺の座標範囲を検証し、最後にSHA-256を表示する。

## 共通processed仕様

- 形式: RFC 7946 GeoJSON `FeatureCollection`
- CRS: EPSG:4326 / WGS 84
- CRS表現: RFC 7946に従い、旧式のトップレベル`crs`メンバーは出力しない
- 共通属性:
  - `hazard_type`: `flood`、`landslide`、`tsunami`、`shelter`
  - `source`: 国土交通省は`MLIT`、国土地理院は`GSI`
- 元データ属性: `A31a_*`、`A33_*`、`A40_*`および日本語の避難所属性を削除せず保持
- 座標変換: 国土数値情報のJGD2011（EPSG:6668）からWGS 84（EPSG:4326）へ`pyproj`で変換。国土地理院GeoJSONは配布座標をEPSG:4326として扱う

## Flood

### 取得情報

- データ名: 国土数値情報 洪水浸水想定区域データ（河川単位、A31a）
- 提供元: 国土交通省
- 対象: 兵庫県、洪水予報河川・水位周知河川
- データ基準年度: 2025年度（令和7年度）
- 配布形式: GeoJSONを格納したZIP
- raw: `data/raw/hyogo/flood/A31a-25_28_10_GEOJSON.zip`
- 公式ページ: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A31a-2025.html
- 直接取得URL: https://nlftp.mlit.go.jp/ksj/gml/data/A31a/A31a-25/A31a-25_28_10_GEOJSON.zip
- 原本CRS: JGD2011、EPSG:6668
- geometry: Polygon

### 変換

ZIP内の4レイヤーを`data/processed/hyogo/flood.geojson`へ統合した。

- 計画規模: `scenario=planned_scale`、`category=inundation_depth`
- 想定最大規模: `scenario=maximum_expected`、`category=inundation_depth`
- 家屋倒壊等氾濫想定区域（氾濫流）: `category=house_collapse_inundation_flow`
- 家屋倒壊等氾濫想定区域（河岸侵食）: `category=house_collapse_bank_erosion`

浸水深ランクを次の`level`へ変換した。

- 1: `0m-0.5m`
- 2: `0.5m-3m`
- 3: `3m-5m`
- 4: `5m-10m`
- 5: `10m-20m`
- 6: `20m+`

主要な追加属性は`scenario`、`category`、`level`、`river_code`、`river_name`、`river_manager_code`、`river_manager`、`depth_rank`、`danger_zone_code`。

### 検証結果と注意点

- 902,748 Feature
- 計画規模342,173件、想定最大規模560,575件
- 座標範囲: 134.273392216～135.4603125 E、34.207125～35.663990232 N
- processedサイズ: 1,007,953,826 bytes

GeoJSONとしてはMapLibre互換だが、約1.01GBの単一ファイルをブラウザへ直接読み込むのは現実的ではない。後続の地図実装では、元geometryを変えずにベクトルタイル等へ配信形式を変更する必要がある。このタスクではタイル化を行わない。

## Landslide

### 取得情報

- データ名: 国土数値情報 土砂災害警戒区域データ（A33）
- 提供元: 国土交通省
- 対象: 兵庫県コード`28`の県別ファイル
- データ基準日: 2025年8月1日
- 配布形式: GeoJSONを格納したZIP
- raw: `data/raw/hyogo/landslide/A33-25_28_GEOJSON.zip`
- 公式ページ: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A33-2025.html
- 直接取得URL: https://nlftp.mlit.go.jp/ksj/gml/data/A33/A33-25/A33-25_28_GEOJSON.zip
- 原本CRS: JGD2011、EPSG:6668
- geometry: Polygon

### 変換

`data/processed/hyogo/landslide.geojson`へ変換した。

現象種別`A33_001`を`category`へ変換した。

- 1: `steep_slope_failure`
- 2: `debris_flow`
- 3: `landslide`

区域区分`A33_002`を`zone_type`へ変換した。

- 1: `warning_zone`
- 2: `special_warning_zone`
- 3: `warning_zone_before_designation`
- 4: `special_warning_zone_before_designation`

主要な追加属性は`category`、`category_code`、`zone_type`、`zone_code`、`prefecture_code`、`zone_number`、`zone_name`、`address`、`announcement_date`、`special_zone_not_designated`。

### 検証結果と注意点

- 38,189 Feature、全件の`prefecture_code`が`28`
- 急傾斜地の崩壊28,100件、土石流9,165件、地すべり924件
- 警戒区域22,958件、特別警戒区域15,231件
- 座標範囲: 134.26585474～135.4666036 E、34.16434305～35.66715283 N
- processedサイズ: 56,726,584 bytes

本データは概略位置を示す参考データであり、法的境界や重要事項説明の根拠には利用できない。指定・解除が国土数値情報へ直ちに反映されるとは限らない。

## Tsunami

### 取得情報

- データ名: 国土数値情報 津波浸水想定データ（A40）
- 提供元: 国土交通省
- 対象: 兵庫県コード`28`
- 対象年度: 2018年度および2016年度
- 配布形式: GML、Shapefile等を格納したZIP。2018年度ZIPにはGeoJSONも同梱
- raw:
  - `data/raw/hyogo/tsunami/A40-18_28_GML.zip`
  - `data/raw/hyogo/tsunami/A40-16_28_GML.zip`
- 公式ページ: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html
- 直接取得URL:
  - https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-18/A40-18_28_GML.zip
  - https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-16/A40-16_28_GML.zip
- 原本CRS: JGD2011、EPSG:6668
- geometry: 2018年度はMultiPolygon、2016年度はPolygon

### 変換

国土交通省の注意事項は最新年度と過年度整備分の併用を求めている。年度別の対象地域は次のとおり。

- 2016年度: 太平洋・瀬戸内海沿岸（神戸、阪神、播磨、淡路島側）。56,517 Feature、緯度34.1551578208203～34.814115752583625度
- 2018年度: 日本海沿岸（豊岡市、香美町、新温泉町）。10,903 Feature、緯度35.53164438623663～35.67483554443度

両データのbounding boxを比較した結果、緯度方向に約0.718度の間隔があり、範囲は交差しない。同一地域の旧版・新版を単純に重ねている状態ではない。

processedへの採用ルールは「同一地域に複数年度がある場合は最新年度を優先し、旧年度の同一地域を採用しない」とする。今回の2データは対象沿岸が異なるため、それぞれの地域で利用可能な版を採用し、`data/processed/hyogo/tsunami.geojson`へ統合した。2018年度の同梱GeoJSONと2016年度の同梱Shapefileを使用しており、GMLの区域形状は変更していない。

対象地域の確認資料:

- 兵庫県 日本海沿岸地域津波浸水想定図: https://web.pref.hyogo.lg.jp/kk37/nihonkaiengantsunami.html
- 兵庫県 南海トラフ巨大地震津波浸水想定図: https://web.pref.hyogo.lg.jp/kk37/nantorashinsuisouteizu.html

主要な追加属性は`data_year`、`level`、`prefecture_name`、`prefecture_code`。`level`には原本の浸水深区分を保持している。

- `0.3m未満`
- `0.3m以上 ～ 1m未満`
- `1m以上 ～ 2m未満`
- `2m以上 ～ 3m未満`
- `3m以上 ～ 4m未満`
- `4m以上 ～ 5m未満`
- `5m以上`

### 検証結果と注意点

- 67,420 Feature
- Polygon 56,517件、MultiPolygon 10,903件
- 全件の`prefecture_code`が`28`
- 座標範囲: 134.32197796254937～135.45998540757887 E、34.1551578208203～35.67483554443 N
- processedサイズ: 53,899,469 bytes

実際の津波が想定を上回る可能性がある。年度の違いは単純な旧版・新版ではなく、整備対象海岸の違いとして保持している。

## Shelter

### 取得情報

- データ名: 指定緊急避難場所・指定避難所データ
- 提供元: 国土地理院
- 対象: 兵庫県の都道府県別データ、コード`28000`
- 取得時の掲載更新日: 2026年9月10日
- 配布形式: CSVおよびGeoJSON
- raw:
  - `28000_1.csv` / `28000_1.geojson`: 指定避難所
  - `28000_2.csv` / `28000_2.geojson`: 指定緊急避難場所
  - `ご利用上の注意.txt`
- 公式ページ: https://hinanmap.gsi.go.jp/hinanjocp/hinanbasho/koukaidate.html
- GeoJSON直接取得URL:
  - https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/geoJSON/28000_1.geojson
  - https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/geoJSON/28000_2.geojson
- 原本CRS: 経度・緯度のGeoJSON。EPSG:4326として処理
- geometry: Point

### 変換

2区分を`data/processed/hyogo/shelter.geojson`へ統合した。

- 指定避難所: `shelter_type=designated_shelter`
- 指定緊急避難場所: `shelter_type=emergency_evacuation_site`

主要な追加属性は`name`、`address`、`common_id`、`shelter_type`、`disaster_types`。指定緊急避難場所の災害対応フラグを`flood`、`landslide`、`storm_surge`、`earthquake`、`tsunami`、`large_fire`、`inland_flood`、`volcanic_phenomenon`の配列へ変換した。指定避難所には災害種別属性がないため、`disaster_types`は空配列になる。

### 検証結果と注意点

- 合計6,676 Feature
- 指定避難所3,002件、指定緊急避難場所3,674件
- 座標範囲: 134.274063～135.458461 E、34.164062～35.66574 N
- processedサイズ: 4,301,045 bytes

県別原本に「池田市立北豊島中学校」（住所は大阪府池田市）が両区分で各1件含まれる。兵庫県配布原本の内容を独自判断で削除せず、そのまま保持した。公開データが最新でない、または未掲載施設が存在する場合があるため、実運用時は各市町村の最新情報を確認する必要がある。

## 利用条件

国土数値情報は各データページのコンテンツ利用規約と都道府県別条件に従う。兵庫県の今回使用分はオープンデータとして提供されている。避難所データは国土地理院コンテンツ利用規約およびrawに保存した「ご利用上の注意」に従う。
