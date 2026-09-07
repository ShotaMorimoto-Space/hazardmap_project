# Architecture

## 1. Purpose

本ドキュメントは、AI Disaster Map Project V1.0のシステム構成と責務分離を定義する。

設計上の最優先事項は以下。

- 5か月・約150時間でV1.0をローンチする
- MVPを優先する
- Hazard EngineをCommerceから独立させる
- 将来の再利用性を確保しつつ、現時点ではOver Engineeringしない

---

## 2. High-Level Architecture

```text
Browser
  |
  v
Next.js (apps/web)
  |  UI / Map Customizer / Shopify連携
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
  +---- Mapbox
  |
  +---- Printful
```

ShopifyはCommerce Adapterとして扱い、Hazard Engineの内部ロジックを持たせない。

---

## 3. Frontend: Next.js

### Responsibilities

- 住所入力
- Mapbox地図表示
- 地図のズーム・中心位置などのUI
- 防災情報の表示
- デザイン選択
- 商品プレビュー
- Shopifyの商品・Cart・Checkout連携
- FastAPIとの通信

### Non-Responsibilities

以下はNext.jsに持たせない。

- 防災判定ロジック
- GIS解析
- 避難所検索ロジック
- ハザードデータ統合
- 将来的に重くなる印刷データ生成ロジック

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
- 将来的な印刷データ生成

### Initial API Concept

```text
GET  /health
POST /api/v1/geocode
POST /api/v1/hazard/analyze
GET  /api/v1/shelters
POST /api/v1/print
```

※ V1.0のAPI仕様はrequirements確定後に詳細化する。

---

## 5. Database: PostgreSQL + PostGIS

PostgreSQLをメインDBとし、地理空間処理のためPostGISを利用する。

### Expected Data

- 住所/地点
- 緯度経度
- 避難所
- ハザードデータ参照情報
- Map生成設定
- Orderとの紐付け情報

### PostGIS Use Cases

- 半径N km以内の避難所検索
- 自宅地点とハザードポリゴンの包含判定
- 距離計算
- 空間インデックス

MVPでは必要な範囲だけ導入し、すべての外部GISデータをDBへ複製することはしない。

---

## 6. Mapbox

Mapboxは主に以下を担当する。

- Web上の地図表示
- 地図スタイル
- Map Customizer UI
- 必要に応じたGeocoding

防災判定そのものはMapboxへ依存させず、FastAPI側のHazard Engineの責務とする。

---

## 7. Shopify

ShopifyはCommerce Adapterとして利用する。

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

これにより将来、Commerce部分を自社ECや他チャネルへ変更しやすくする。

---

## 8. Printful

Printfulは印刷・Fulfillment Adapterとして利用する。

### Responsibilities

- 印刷商品の受注
- 印刷
- 発送

注文成立後、必要な印刷データと注文情報を連携する。

---

## 9. Repository Structure

Monorepoを採用する。

```text
hazardmap_project/

├── apps/
│   ├── web/
│   │   └── Next.js + TypeScript
│   │
│   └── api/
│       └── FastAPI + Python
│
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── decisions.md
│   └── progress.md
│
├── PROJECT_GUIDELINES.md
├── docker-compose.yml
└── README.md
```

FrontendとBackendは分離するが、V1.0では別リポジトリにはしない。

---

## 10. Deployment Principle

V1.0ではFrontendとBackendを別プロセスとしてデプロイできる構成にする。

想定:

```text
Next.js Hosting
      |
      v
FastAPI Hosting
      |
      v
PostgreSQL + PostGIS
```

具体的なホスティングサービスはPhase1またはPhase2でDecisionとして確定する。

---

## 11. Security Principle

最低限以下を守る。

- APIキーをGitHubへコミットしない
- `.env` / Secret管理を利用する
- Backend APIへの入力値検証を行う
- 外部API失敗時のエラー処理を行う
- 必要になるまで独自認証基盤を作らない

---

## 12. Architecture Boundaries

### Next.js
Presentation / User Interaction / Commerce UI

### FastAPI
Domain Logic / Hazard Engine / GIS

### PostgreSQL + PostGIS
Persistent Data / Spatial Query

### Shopify
Commerce

### Printful
Fulfillment

### Mapbox
Map Visualization / Map-related external service

---

## 13. MVP Constraint

以下はV1.0開始時点では行わない。

- マイクロサービス分割
- Kubernetes
- Event-driven architectureの本格導入
- 独自Commerce基盤
- 独自認証基盤
- 不要なデータレイク
- 全自治体データの事前統合

必要になった時点でDecisionを追加する。
