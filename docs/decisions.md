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
