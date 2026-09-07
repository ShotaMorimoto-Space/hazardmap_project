# AI Disaster Map Project

## Project Overview

本プロジェクトは、

**「自宅住所を入力すると、自宅専用のオリジナルマップを生成し、防災情報を必要に応じて重ね、そのまま購入できるECサービス」**

を構築することを目的とする。

本プロジェクトは、
**AIと個人1人だけでどこまでサービス開発ができるか**
を検証する実験でもある。

---

# Mission

5か月（約150時間）でV1.0をローンチする。

ローンチ時点では、

- 商品を公開
- 実際に購入可能
- Printfulへ自動注文
- 顧客へ発送

までを実現する。

---

# Development Philosophy

このプロジェクトは、

「自分がプログラマーになる」

ことが目的ではない。

目的は、

**AIを最大限活用し、事業責任者1人でサービスを立ち上げること**

である。

---

# Team Structure

## Human

Role: Project Owner

役割:

- プロダクト判断
- 優先順位決定
- UX判断
- ビジネス判断
- 最終レビュー

---

## ChatGPT

Role: PM / CTO

責務:

- 要件定義
- 機能整理
- 優先順位決定
- Architecture設計
- DB設計
- API設計
- Cursorへの指示作成
- コードレビュー
- GitHub Issue作成支援
- 次タスク決定

ChatGPTは **「What」** を担当する。

---

## Cursor

Role: Engineer

責務:

- 実装
- リファクタリング
- バグ修正
- テスト
- Git操作

Cursorは **「How」** を担当する。

---

# Tech Stack

## Frontend

- Next.js
- TypeScript

## Backend

- FastAPI
- Python

## Database

- PostgreSQL
- PostGIS

## Commerce

- Shopify

## Map

- Mapbox

## Print / Fulfillment

- Printful

## Version Control

- GitHub

## Repository Strategy

- Monorepo
- `apps/web` にNext.js
- `apps/api` にFastAPI

---

# Architecture Principles

Shopifyは **Commerce Adapter** として利用する。

地図生成や防災ロジックをShopifyへ持たせない。

Map CustomizerとHazard EngineはCommerceから分離して設計する。

FastAPIは、以下のコアバックエンド処理を担う。

- 防災データ取得・統合
- Geocoding制御
- 避難所検索
- 洪水・土砂災害・津波などの判定
- 地理空間処理
- 将来的な印刷データ生成処理

Next.jsは、以下を担う。

- Web UI
- 住所入力
- Mapbox上の表示・操作
- Map Customizer
- デザインテンプレート選択
- 商品プレビュー
- Shopify連携
- 購入導線

Mapboxは、地図表示とMap Styleのカスタマイズに利用する。

V1.0のデザインテンプレートは、Mapboxのカスタムスタイルを利用して作成する。

ユーザーは以下をカスタマイズできる。

- 防災レイヤー
  - なし
  - 洪水
  - 土砂災害
  - 津波
- 避難所
  - 表示
  - 非表示
- 任意マーカー
  - 追加
  - 削除
- Mapboxベースのデザインテンプレート
- 地図表示範囲
- 商品サイズ
  - A2
  - A1
- フレーム
  - あり
  - なし

防災レイヤーは同時に最大1種類とする。

ユーザー任意マーカーについて、V1.0では名称入力やメモ入力は実装しない。

将来的に、

Shopify

↓

自社EC

↓

Amazon

などへ変更可能な構造を維持する。

Hazard Engineは、将来的にWeb EC以外のチャネルからも再利用可能な構造を目指す。

ただし、MVP段階ではマイクロサービス化しない。
FastAPIは単一バックエンドアプリケーションとして構築する。

---

# Development Rules

## 1日最大60分

開発時間は最大60分。

時間が来たら終了する。

---

## 1日1Issue

基本的にGitHub Issueを1件だけ進める。

複数Issueへ手を出さない。

---

## Acceptance Criteria First

実装前に必ずAcceptance Criteriaを書く。

実装後はAcceptance Criteriaでレビューする。

---

## No Over Engineering

現時点で不要なものは作らない。

将来を考えすぎて設計を複雑にしない。

MVPを最優先する。

FastAPI採用はマイクロサービス化を意味しない。

FrontendとHazard Engineの責務分離に必要な最小構成として扱う。

---

## Single Source of Truth

すべての正式な仕様はGitHubを正とする。

ChatGPTの過去回答より、GitHub上の最新Docs / Issues / Decisionsを優先する。

重要な仕様変更があった場合は、必要に応じて以下を更新する。

- `PROJECT_GUIDELINES.md`
- `docs/requirements.md`
- `docs/architecture.md`
- `docs/decisions.md`
- `docs/progress.md`

---

# GitHub Structure

```text
hazardmap_project/

├── apps/
│   ├── web/          # Next.js + TypeScript
│   └── api/          # FastAPI + Python
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

GitHub運用は原則として以下とする。

```text
main
 ↓
feature/issue-X
 ↓
Pull Request
 ↓
Review
 ↓
main
```

初期ドキュメント整備を除き、直接mainへ実装を重ねる運用は避ける。

---

# Required Documents

## requirements.md

V1.0の機能要件を定義する。

---

## architecture.md

システム設計と各コンポーネントの責務を定義する。

---

## decisions.md

重要な技術的意思決定を記録する。

例:

- なぜFastAPIを採用するか
- なぜPostGISを利用するか
- なぜMonorepoなのか
- なぜMapboxなのか

---

## progress.md

週次サマリーを記録する。

毎日の詳細ではなく、1週間ごとのまとめを書く。

---

# Daily Workflow

## Step 1（10分）

ChatGPT

- 今日やるIssueを決める
- 目的を明確にする
- Acceptance Criteriaを作成する

---

## Step 2（40分）

Cursor

- Issueを実装する
- 必要なテストを行う
- Gitへ反映する

---

## Step 3（10分）

ChatGPT

- 実装内容をレビューする
- Acceptance Criteriaに基づきDone判定
- 次Issueを提案する
- 必要に応じてprogress更新内容を提案する

---

# Development Phases

## Phase 0 — Product Design

- 要件定義
- User Flow
- Screen設計

---

## Phase 1 — Architecture

- DB
- API
- Domain設計
- Next.js / FastAPI責務分離
- Printful商品実現性確認

---

## Phase 2 — Foundation

- Next.js
- FastAPI
- PostgreSQL / PostGIS
- Shopify
- Mapbox
- GitHub

---

## Phase 3 — Map Customizer

- 地図表示
- Mapboxデザインテンプレート
- 防災レイヤー選択
- 避難所ON / OFF
- 任意マーカー
- UI
- リアルタイムプレビュー

---

## Phase 4 — Disaster Engine

- 避難所
- 洪水
- 土砂災害
- 津波

---

## Phase 5 — Commerce

- Product
- Variant
- Cart
- Checkout
- Order

---

## Phase 6 — Production

- Print Data
- Printful

---

## Phase 7 — QA

- スマホ表示
- 印刷品質
- UX
- 注文テスト

---

## Phase 8 — Launch

Production Release

---

# V1.0 Product Scope

V1.0では以下を実現する。

- 日本国内住所入力
- 自宅中心のMapbox地図生成
- 防災レイヤー選択
  - なし
  - 洪水
  - 土砂災害
  - 津波
- 避難所表示 / 非表示
- 任意マーカー追加 / 削除
- Mapboxカスタムスタイルによる複数デザインテンプレート
- 地図表示範囲調整
- リアルタイムプレビュー
- A2 / A1商品
- フレームあり / なし
- Shopifyで購入・決済
- Printfulへ注文
- 製造・発送

---

# V1.0 Out of Scope

V1.0では以下は原則実装しない。

- A3商品
- スマートフォンアプリ
- ユーザー独自アカウントシステム
- SNS機能
- 防災通知
- リアルタイム災害速報
- AIチャット防災相談
- 多言語対応
- 海外住所対応
- 自治体向け管理画面
- 複数住所管理
- 高度な自由編集デザインツール
- 複数防災レイヤー同時表示
- マーカー名称入力
- マーカーメモ入力
- 自動避難経路生成
- GPSナビゲーション
- Amazon販売連携
- 独自EC / 独自決済
- マイクロサービス化

---

# AI Rules

ChatGPTは、コードを書くことより設計品質を重視する。

Cursorは実装を担当する。

ChatGPTはCursorの成果物をレビューする。

ChatGPTとCursorは会話内容そのものを共有するのではなく、
GitHub上のDocs / Issues / Pull Requestsを介して共通認識を持つ。

---

# Project Goal

本プロジェクトは、

「AIを使ったECサービス」

ではない。

本プロジェクトは、

**AI時代に個人1人でどこまで事業を構築できるか**

を検証する実験である。

すべての意思決定はこの目的に沿って行う。
