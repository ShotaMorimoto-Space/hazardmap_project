# Architecture

## 1. Purpose

本ドキュメントは、AI Disaster Map Project V1.0のシステム構成と責務分離を定義する。

設計上の最優先事項は以下。

- 5か月・約150時間でV1.0をローンチする
- MVPを優先する
- Hazard EngineをCommerceから独立させる
- 将来の再利用性を確保しつつ、現時点ではOver Engineeringしない
- まずValidation Releaseで商品価値を検証し、その後Commercial V1へ進む

---

## 2. High-Level Architecture

```text
Browser
  |
  v
Next.js (apps/web)
  |  UI / Map Creator / Product Preview
  |
  | REST API
  v
FastAPI (apps/api)
  |  Hazard Engine / GIS / Data Integration
  |
  +---- PostgreSQL + PostGIS
  |
  +---- External Hazard/Open Data
  |
  +---- Map Provider
  |       └─ Validation: Stadia Maps
  |
  +---- Future Commerce / Fulfillment
          ├─ Shopify
          └─ Printful
```

Validation Releaseでは、地図表示に **Stadia Maps + MapLibre GL JS** を利用し、地図スタイル作成には **Maputnik** を利用する。

Map Providerは将来差し替え可能な境界として扱い、Commercial V1前にMapboxを再評価する。

---

## 3. Frontend: Next.js

### Responsibilities

- 住所入力
- MapLibreによる地図表示
- 地図のズーム・中心位置などのUI
- 防災情報の表示
- Layout選択
- Title編集
- Map Style選択
- Shelter表示ON/OFF
- Family Places追加・削除
- 商品プレビュー
- Frontend State管理
- localStorageへの途中保存
- FastAPIとの通信
- 将来的なShopify Cart / Checkout連携

### Non-Responsibilities

以下はNext.jsに持たせない。

- 防災判定ロジック
- GIS解析
- 避難所検索ロジック
- ハザードデータ統合
- 将来的な印刷データ生成ロジック

---

## 4. Backend: FastAPI

FastAPIは本サービスのコアとなるHazard Engineを提供する。

### Responsibilities

- 住所または緯度経度を受け取るAPI
- Geocoding制御
- 自宅地点の位置情報管理
- 避難所検索
- 洪水ハザード判定
- 土砂災害ハザード判定
- 津波ハザード判定
- 地理空間計算
- 防災オープンデータ/APIの統合
- フロントエンド向けレスポンス整形
- Map Config保存
- 将来的な印刷データ生成

### Initial API Concept

```text
GET  /health
POST /api/v1/geocode
POST /api/v1/map-context
POST /api/v1/map-configs
GET  /api/v1/map-configs/{id}
POST /api/v1/print
```

`/api/v1/map-context` は、指定地点周辺のHazard / Shelter等、Map Creatorに必要な情報を返す統合API候補とする。

APIの細分化は実装段階で必要性を見て判断する。

---

## 5. Map Config

Map Configを、ユーザーが作成した地図の「設計図」として扱う。

### Example

```json
{
  "location": {
    "address": "兵庫県...",
    "lat": 34.78,
    "lng": 135.40
  },
  "layout": "circle",
  "title": "わたしたちのまち",
  "title_visible": true,
  "map_style": "soft-family",
  "map_view": {
    "center_lat": 34.78,
    "center_lng": 135.40,
    "zoom": 14
  },
  "hazard_layer": "flood",
  "shelter_visible": true,
  "family_places": [
    {
      "lat": 34.779,
      "lng": 135.402
    }
  ]
}
```

Map Configは以下で共通利用する。

- Map Creator
- Product Preview
- Product Configuration
- Validation表示
- 将来的なShopify Order
- 将来的なPrint Data生成

---

## 6. State / Draft Persistence

V1では独自アカウント・マイページを作らない。

### Editing State

Map Creator操作中は、状態をFrontend Stateとして保持する。

```text
User Interaction
      |
      v
Next.js State
      |
      +---- Preview
      |
      +---- localStorage
```

### Draft Resume

途中離脱対策として、Map Configの下書きをlocalStorageへ自動保存する。

同じ端末・同じブラウザで再アクセスした場合、「前回のマップを続けますか？」という形で再開可能にする。

V1では以下は行わない。

- ユーザーアカウント
- クラウド下書き保存
- 複数端末同期
- マイページ
- 複数Map管理

---

## 7. Database Save Timing

「次へ」ボタンではDB保存しない。

CustomizerからProduct Configurationへ移動しても、Frontend State + localStorageで状態を保持する。

Commercial V1では、ユーザーが **カートに追加** したタイミングで初めてMap ConfigをDBへ保存する。

```text
Map Creator
     |
     v
Frontend State + localStorage
     |
     v
Product Configuration
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
```

理由:

- 閲覧・試作だけのデータをDBへ大量保存しない
- ブラウザバックによる不要データ生成を避ける
- 購入意向が生じた時点からサーバー保存する
- Commerceとの紐付けを明確にする

未購入のMap Configは `pending` として扱い、将来一定期間後に削除可能な設計とする。

Validation ReleaseではCommerceを実装しないため、原則としてMap ConfigはlocalStorage中心で扱う。

---

## 8. Database: PostgreSQL + PostGIS

PostgreSQLをメインDBとし、地理空間処理のためPostGISを利用する。

### Expected Data

Commercial V1で少なくとも以下を想定する。

```text
map_configs
- id
- config_json
- status
- created_at
- updated_at
```

```text
orders
- id
- shopify_order_id
- map_config_id
- print_status
- printful_order_id
```

ユーザーアカウントを持たないため、V1では `users` テーブルを必須としない。

### PostGIS Use Cases

- 半径N km以内の避難所検索
- 自宅地点とハザードポリゴンの包含判定
- 距離計算
- 空間インデックス

MVPでは必要な範囲だけ導入し、すべての外部GISデータをDBへ複製することはしない。

---

## 9. Map Platform

### Validation Release

以下を採用する。

```text
Stadia Maps
   |
   | Vector Tiles / Map Data
   v
MapLibre GL JS
   |
   v
Next.js Map Creator
```

### Style Authoring

地図スタイル作成にはMaputnikを利用する。

```text
Stadia Maps compatible style
        |
        v
Maputnik
        |
        v
Style JSON
        |
        v
MapLibre GL JS
```

MaputnikでSoft Family Nordicの地図スタイルを作成し、Style JSONをMapLibreで再現する。

### Design Principle

- Warm White / Light Beigeを背景
- RoadはSoft Gray
- WaterはMuted Blue
- ParkはMuted Sage
- POIは必要最低限
- 地名表示を整理
- Home / Shelter / Family Placesの視認性を上げる

### Provider Boundary

Map Provider固有の実装を可能な限り限定する。

Map ConfigにはProvider固有値を極力持たせず、

- center
- zoom
- style identifier
- markers
- hazard selection

などの汎用設定を保持する。

Commercial V1前に、Stadia Maps継続またはMapbox移行を再評価する。

---

## 10. Hazard / Shelter Data Flow

```text
Address Input
     |
     v
Next.js
     |
     v
FastAPI
     |
     +---- Geocoding
     |
     +---- Hazard Data
     |
     +---- Shelter Data
     |
     +---- GIS Processing
     |
     v
Map Context Response
     |
     v
Next.js + MapLibre
```

防災判定そのものはMap Providerへ依存させない。

地図Providerを変更しても、Hazard Engineを再利用できる構造とする。

---

## 11. Validation Release

Commercial V1の前にValidation Releaseを設ける。

### Goal

検証したいのは、**「このデザイン・機能・価格のカスタムハザードマップを欲しいと思うか」** である。

### Scope

```text
Landing Page
    |
    v
Address Input
    |
    v
Map Creator
    |
    v
Soft Family Nordic Preview
    |
    v
Product / Price Preview
    |
    v
Purchase Intent
```

### In Scope

- Landing Page
- Address Input
- Map Creator
- Stadia Maps + MapLibre
- Maputnik Style
- Layout
- Title
- Map Style
- Map Position / Zoom
- Hazard Layer
- Shelter
- Family Places
- Product Preview
- A2 / A1表示
- Frame有無表示
- 価格表示
- 購入意向取得

### Out of Scope

- 本決済
- Shopify Checkout
- Printful自動連携
- 本番印刷
- マイページ
- ユーザーアカウント

---

## 12. Shopify

ShopifyはCommercial V1以降のCommerce Adapterとして利用する。

### Responsibilities

- Product
- Price
- Cart
- Checkout
- Payment
- Order

### Non-Responsibilities

- 防災ロジック
- GIS処理
- 避難所検索
- 地図生成ルール

### Map Config Link

Commercial V1では、カート追加時に発行した `map_config_id` をShopify側へ渡す。

```text
Map Config
    |
    v
map_config_id
    |
    v
Shopify Cart / Order
```

注文成立後、そのIDから自社DBのMap Configを取得する。

---

## 13. Printful

PrintfulはCommercial V1以降のFulfillment Adapter候補とする。

### Future Flow

```text
Shopify Order Created
       |
       v
Webhook
       |
       v
FastAPI
       |
       v
map_config_id
       |
       v
Map Config
       |
       v
Print Renderer
       |
       v
Printful API
       |
       v
Manufacture / Shipping
```

Validation ReleaseではPrintful自動連携を実装しない。

印刷品質確認は、商品化フェーズに進むことが決まった時点で実施する。

---

## 14. Digital Download

デジタルダウンロード商品は将来候補として保持するが、Validation Releaseおよび初期Commercial V1の必須要件にはしない。

理由:

- Core Conceptは「飾るハザードマップ」
- Physical Posterの方が日常的に目に入る価値と整合する
- まず本命商品の需要を検証する
- SKU / 権利 / ダウンロード配信などの追加複雑性を避ける

需要検証後にEntry Productとして再評価する。

---

## 15. Repository Structure

Monorepoを採用する。

```text
hazardmap_project/

├── apps/
│   ├── web/
│   │   └── Next.js + TypeScript
│   └── api/
│       └── FastAPI + Python
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── decisions.md
│   ├── progress.md
│   ├── screens.md
│   └── persona_design.md
├── PROJECT_GUIDELINES.md
├── docker-compose.yml
└── README.md
```

FrontendとBackendは分離するが、V1.0では別リポジトリにはしない。

---

## 16. Deployment Principle

V1.0ではFrontendとBackendを別プロセスとしてデプロイできる構成にする。

```text
Next.js Hosting
      |
      v
FastAPI Hosting
      |
      v
PostgreSQL + PostGIS
```

具体的なホスティングサービスは後続Decisionで確定する。

---

## 17. Security Principle

最低限以下を守る。

- APIキーをGitHubへコミットしない
- `.env` / Secret管理を利用する
- Backend APIへの入力値検証を行う
- 外部API失敗時のエラー処理を行う
- 必要になるまで独自認証基盤を作らない
- localStorageには決済情報やSecretを保存しない

---

## 18. Architecture Boundaries

### Next.js
Presentation / User Interaction / Draft State / Commerce UI

### FastAPI
Domain Logic / Hazard Engine / GIS / Map Config Persistence

### PostgreSQL + PostGIS
Persistent Data / Spatial Query

### Stadia Maps
Validation Map Data / Tiles

### MapLibre GL JS
Client-side Map Rendering / Interaction

### Maputnik
Map Style Authoring

### Shopify
Commercial V1 Commerce

### Printful
Commercial V1 Fulfillment

---

## 19. MVP Constraint

以下はValidation Release開始時点では行わない。

- マイクロサービス分割
- Kubernetes
- Event-driven architectureの本格導入
- 独自Commerce基盤
- 独自認証基盤
- マイページ
- クラウド下書き保存
- 不要なデータレイク
- 全自治体データの事前統合
- Printful自動連携
- Digital Download販売

必要になった時点でDecisionを追加する。

---

## 20. Validation to Commercial V1

```text
Phase 0
Product Design
✅ Complete

Phase 1
Architecture

Phase 2
Foundation

Phase 3
Map Creator

-------------------------
Validation Release
-------------------------

Landing Page
Map Creator
Product Preview
Price
Purchase Intent

        |
        v

Value Validation

        |
        +---- Weak → Product / Positioning Review
        |
        └---- Strong
               |
               v
       Commercial V1
               |
               +---- Map Provider Re-evaluation
               +---- Shopify
               +---- Print Renderer
               +---- Printful
               +---- Production QA
```

まず価値を検証し、Commerce / Fulfillmentへの本格投資は検証結果を見て判断する。
