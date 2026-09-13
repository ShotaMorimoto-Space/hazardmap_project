# Architecture Decisions

このファイルは、プロジェクトにおける重要な技術判断とその理由を記録する。

---

# ADR-001: BackendにFastAPIを採用する

Status: Accepted

Date: 2026-09-07

## Context

当初は、開発速度と構成の単純化を優先し、Next.js API RoutesへFrontendとBackendを集約する案を検討した。

しかし、本サービスの中核は一般的なEC処理ではなく、

**「住所・位置情報から、その地点固有の防災情報を解析し、専用の防災マップを生成するHazard Engine」**

である。

将来的には以下の処理が想定される。

- Geocoding
- 避難所検索
- 洪水判定
- 土砂災害判定
- 津波判定
- GISデータ処理
- 地理空間計算
- 外部防災データ統合
- 印刷用データ生成

これらはEC/UIとは異なるドメインであり、独立したBackendとして扱う価値がある。

## Decision

FrontendにはNext.js、BackendにはFastAPIを採用する。

```text
Next.js
   |
   | REST API
   v
FastAPI
   |
   v
PostgreSQL + PostGIS
```

FastAPIをHazard Engineの境界として利用する。

## Reasons

### 1. Hazard Engineを独立させるため

防災ロジックをNext.jsやShopifyから切り離し、独立したドメインとして維持する。

### 2. PythonのGISエコシステムを利用できるため

将来的に以下のライブラリを利用する可能性がある。

- GeoPandas
- Shapely
- Rasterio
- GDAL
- NumPy
- Pandas

GIS処理が増えた場合にPythonを採用しているメリットが大きい。

### 3. Commerceへの依存を減らすため

ShopifyはCommerce Adapterとして扱う。

将来的に

- 自社EC
- 他EC
- 自治体向けWeb
- モバイルアプリ
- 外部API提供

などへ展開する場合でも、Hazard Engineを再利用しやすい。

### 4. 本番環境でFrontend / Backendを個別に拡張できるため

Next.jsとFastAPIを別プロセスとしてデプロイ可能にし、それぞれの負荷特性に応じて拡張できる。

## Trade-offs

FastAPIを導入することで、Next.js単独構成と比較して以下が増える。

- Python環境
- Backendデプロイ
- API通信
- CORS
- 環境変数管理
- Frontend / Backend間の型・仕様管理

そのため、開発複雑性は上昇する。

## Mitigation

MVPではマイクロサービス化しない。

単一GitHub Repository内に以下を配置するMonorepo構成とする。

```text
apps/web
apps/api
```

FastAPIも単一アプリケーションとして開始する。

これにより、責務分離のメリットを得ながら一人開発の複雑性を抑える。

## Consequences

- Next.js API RoutesはBackendの中心にはしない
- Hazard関連ロジックはFastAPI側に実装する
- PostgreSQL + PostGISをBackendから利用する
- FrontendとBackendのAPI契約を明確にする必要がある

---

# ADR-002: PostgreSQLにPostGISを追加する

Status: Accepted

Date: 2026-09-07

## Context

本サービスでは自宅位置と周辺避難所、ハザード区域などの空間関係を扱う。

通常のPostgreSQLだけでも緯度経度の保存は可能だが、距離・包含・交差などの地理空間処理が増えることが想定される。

## Decision

PostgreSQLにPostGIS Extensionを利用する。

## Reasons

- 半径検索
- 距離計算
- Point in Polygon判定
- 空間インデックス
- GISデータとの親和性

をDB層で扱えるため。

## Constraint

MVPではPostGISを利用するためだけに全てのGISデータをDBへ取り込まない。

必要なデータ・機能から段階的に利用する。

---

# ADR-003: Monorepoを採用する

Status: Accepted

Date: 2026-09-07

## Decision

Next.jsとFastAPIを別リポジトリにせず、一つのGitHub Repositoryで管理する。

```text
apps/web
apps/api
```

## Reasons

- 1人開発で管理しやすい
- CursorがFrontend / Backend / Docsを同時に参照できる
- ChatGPTとCursorが同じSingle Source of Truthを参照できる
- Issue / PR / Architecture Decisionを一元管理できる
- V1.0ではRepository分割のメリットより運用負荷の方が大きい

将来、独立開発チームや独立ライフサイクルが必要になった場合に再検討する。

---

# ADR-004: Validation版のMap PlatformにStadia Maps + MapLibreを採用する

Status: Accepted

Date: 2026-09-13

## Context

当初はMapboxを地図表示・地図スタイル・印刷用途の候補としていた。

しかし現時点では、商用印刷時の利用条件、Commercial Print Rightsの費用、月間注文ボリューム、実際の販売規模が未確定であり、Mapboxへの正式な商用条件確認に必要な事業前提がまだ弱い。

一方、現在のプロジェクトフェーズでは、Commerce / Fulfillmentを完成させることより、

**「Soft Family Nordicデザインのカスタムハザードマップに購入価値があるか」**

を検証することが優先される。

## Decision

Validation Releaseでは以下を採用する。

```text
Stadia Maps
+
MapLibre GL JS
+
Maputnik
```

役割は以下。

- Stadia Maps: Map Data / Vector Tiles
- MapLibre GL JS: Web地図表示・操作
- Maputnik: Map Style作成

Commercial V1へ進む前に、Stadia Maps継続またはMapbox移行を再評価する。

## Reasons

- Soft Family Nordicに必要な地図デザイン自由度を確保できる
- MapLibre Style JSONとしてデザインを管理できる
- MaputnikでGUIによるStyle編集ができる
- Mapbox固定よりProvider Lock-inを抑えられる
- 現時点の価値検証を止めずに進められる
- 将来Mapboxを再評価できる

## Consequences

- architecture.mdのMapbox固定表現を廃止する
- Map ConfigにはProvider固有情報を極力持たせない
- Map StyleはStadia-compatibleなStyle JSONから開始する
- Mapbox移行時にはStyle再構築が発生する可能性がある
- Hazard EngineはMap Providerから独立させる

---

# ADR-005: V1ではマイページを作らずlocalStorageで途中再開する

Status: Accepted

Date: 2026-09-13

## Context

Map Creatorではユーザーが、住所、Layout、Title、Map Style、Map Position、Zoom、Hazard Layer、Shelter、Family Placesなどを編集する。

想定作成時間は数分〜十数分程度であり、途中離脱から復帰できる価値はある。

一方、途中保存のためだけに、ユーザー登録、Login、マイページ、クラウドDraft、複数端末同期を導入するとV1の開発範囲が大きくなる。

## Decision

V1ではマイページ・独自ユーザーアカウントを実装しない。

作成途中のMap ConfigはFrontend Stateで保持し、localStorageへ自動保存する。

同じ端末・同じブラウザでは作成再開を可能にする。

## Reasons

- 中断復帰というユーザー価値を低コストで提供できる
- 認証基盤が不要
- DBへDraftデータを大量保存しなくてよい
- MVPの開発時間を抑えられる

## Trade-offs

- 別端末から再開できない
- ブラウザデータ削除でDraftが消える
- 複数Map管理ができない

これらは需要確認後に再検討する。

---

# ADR-006: Map Configはカート追加時にDB保存する

Status: Accepted

Date: 2026-09-13

## Context

Map Creatorの状態を「次へ」のタイミングでDB保存すると、ブラウザバック、Preview確認だけ、購入しないユーザー、試し操作による不要なMap Configが大量に残る可能性がある。

## Decision

Map CreatorおよびProduct Configuration中は、Frontend State + localStorageで保持する。

Commercial V1では、ユーザーが **カートに追加** した時点で初めてMap ConfigをDB保存する。

保存時に `map_config_id` を発行する。

## Future Commerce Flow

```text
Map Config
    |
    | Add to Cart
    v
FastAPI
    |
    v
PostgreSQL
    |
    v
map_config_id
    |
    v
Shopify Cart / Order
```

## Pending Data

注文成立前はMap Configを `pending` として扱う。

購入されなかったpendingデータについては、一定期間後に削除可能な設計とする。

## Consequences

- 「次へ」ではDB書き込みをしない
- Validation Releaseでは原則localStorageのみでよい
- Shopify導入時にmap_config_idを注文情報へ連携する
- DB保存量を購入意向のあるユーザー中心に抑える

---

# ADR-007: Commercial V1前にValidation Releaseを設ける

Status: Accepted

Date: 2026-09-13

## Context

当初は5か月でShopify・Printfulまで含めた完全なV1販売を目標としていた。

しかし現時点では、商品コンセプトへの需要、Soft Family Nordicデザインへの評価、想定価格での購入意向がまだ検証されていない。

この状態でCommerce / Fulfillmentまで先に構築すると、価値が未検証の状態で開発投資が大きくなる。

## Decision

Commercial V1より前にValidation Releaseを設ける。

Validation Releaseでは以下を検証する。

```text
Landing Page
↓
Address Input
↓
Map Creator
↓
Product Preview
↓
A2 / A1
↓
Frame有無
↓
Price
↓
Purchase Intent
```

本決済・Shopify・Printful自動連携は必須としない。

## Primary Validation Question

**「このデザイン・機能・価格のカスタムハザードマップを実際に欲しいと思うか」**

## Consequences

Validation結果が弱い場合は、Commerce開発前にProduct、Positioning、Design、Price、Target Personaを見直す。

Validation結果が強い場合はCommercial V1へ進む。

---

# ADR-008: Digital Download商品は初期V1では実装しない

Status: Accepted

Date: 2026-09-13

## Context

Physical Posterより低価格なEntry Productとして、Mapデータのみを購入・ダウンロードできる商品案を検討した。

一方、本サービスのCore Conceptは、

**「飾るハザードマップ」**

であり、Physical Posterとして日常空間に存在すること自体が価値の一部である。

## Decision

Digital Downloadは将来候補として残すが、Validation Releaseおよび初期Commercial V1の必須要件には含めない。

## Reasons

- Physical Posterの価値検証を優先する
- SKUを増やさない
- Download配信実装を追加しない
- 地図利用権利の確認範囲を増やさない
- Core Conceptを明確に保つ

需要が確認できた場合、Entry Productとして再評価する。
