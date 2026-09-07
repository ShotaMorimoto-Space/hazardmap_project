# AI Disaster Map Project

## Project Overview

本プロジェクトは、

**「自宅住所を入力すると、自宅専用のオシャレな防災マップを生成し、そのまま購入できるECサービス」**

を構築することを目的とする。

本プロジェクトは
**AIと個人1人だけでどこまでサービス開発ができるか**
を検証する実験でもある。

---

# Mission

5か月（約150時間）でV1.0をローンチする。

ローンチ時点では

- 商品を公開
- 実際に購入可能
- Printfulへ自動注文
- 顧客へ発送

までを実現する。

---

# Development Philosophy

このプロジェクトは

「自分がプログラマーになる」

ことが目的ではない。

目的は

**AIを最大限活用し、事業責任者1人でサービスを立ち上げること**

である。

---

# Team Structure

## Human

Project Owner

役割

- プロダクト判断
- 優先順位決定
- UX判断
- ビジネス判断
- 最終レビュー

## ChatGPT

Role: PM / CTO

責務

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

ChatGPTは「What」を担当する。

## Cursor

Role: Engineer

責務

- 実装
- リファクタリング
- バグ修正
- テスト
- Git操作

Cursorは「How」を担当する。

---

# Tech Stack

Frontend
- Next.js
- TypeScript

Backend
- FastAPI
- Python

Database
- PostgreSQL
- PostGIS

Commerce
- Shopify

Map
- Mapbox

Print / Fulfillment
- Printful

Version Control
- GitHub

Repository Strategy
- Monorepo
- `apps/web` にNext.js
- `apps/api` にFastAPI

---

# Architecture Principles

ShopifyはCommerce Adapterとして利用する。

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

- UI
- 住所入力
- Mapbox上の表示・操作
- デザイン編集
- 商品プレビュー
- Shopify連携
- 購入導線

将来的にShopify、自社EC、Amazonなどへ変更可能な構造を維持する。

Hazard Engineは、将来的にWeb EC以外のチャネルからも再利用可能な構造を目指す。

ただし、MVP段階ではマイクロサービス化しない。
FastAPIは単一バックエンドアプリケーションとして構築する。

---

# Development Rules

## 1日最大60分

開発時間は最大60分。
時間が来たら終了する。

## 1日1Issue

基本的にGitHub Issueを1件だけ進める。
複数Issueへ手を出さない。

## Acceptance Criteria First

実装前に必ずAcceptance Criteriaを書く。
実装後はAcceptance Criteriaでレビューする。

## No Over Engineering

現時点で不要なものは作らない。
将来を考えすぎて設計を複雑にしない。
MVPを最優先する。

FastAPI採用はマイクロサービス化を意味しない。
FrontendとHazard Engineの責務分離に必要な最小構成として扱う。

## Single Source of Truth

すべての仕様はGitHubを正とする。
ChatGPTの回答よりGitHub Docsを優先する。

---

# GitHub Structure

```text
hazardmap_project/

├── apps/
│   ├── web/          # Next.js
│   └── api/          # FastAPI
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

直接mainへ実装を重ねる運用は避ける。

---

# Required Documents

## requirements.md
機能要件

## architecture.md
システム設計

## decisions.md
技術的意思決定

例:
- なぜFastAPIを採用するか
- なぜMapboxなのか
- なぜPostGISを利用するか

## progress.md
週次サマリー。
毎日の詳細ではなく1週間ごとのまとめを書く。

---

# Daily Workflow

## Step1（10分）

ChatGPT
- 今日やるIssueを決める
- 目的を明確にする
- Acceptance Criteria作成

## Step2（40分）

Cursor
- Issueを実装

## Step3（10分）

ChatGPT
- レビュー
- Done判定
- 次Issue提案
- progress更新内容提案

---

# Development Phases

## Phase0 Product Design
- 要件定義
- User Flow
- Screen設計

## Phase1 Architecture
- DB
- API
- Domain設計
- Next.js / FastAPI責務分離

## Phase2 Foundation
- Next.js
- FastAPI
- PostgreSQL / PostGIS
- Shopify
- Mapbox
- GitHub

## Phase3 Map Customizer
- 地図
- デザイン
- UI

## Phase4 Disaster Engine
- 避難所
- 洪水
- 土砂災害
- 津波

## Phase5 Commerce
- Cart
- Checkout
- Order

## Phase6 Production
- Print Data
- Printful

## Phase7 QA
- スマホ
- 印刷
- UX

## Phase8 Launch
Production Release

---

# AI Rules

ChatGPTはコードを書くことより設計品質を重視する。

Cursorは大量実装を行う。

ChatGPTはCursorの成果物をレビューする。

ChatGPTとCursorは会話内容そのものを共有するのではなく、
GitHub上のDocs / Issues / Pull Requestsを介して共通認識を持つ。

---

# Project Goal

本プロジェクトは「AIを使ったECサービス」ではない。

本プロジェクトは

**AI時代に個人1人でどこまで事業を構築できるか**

を検証する実験である。

すべての意思決定はこの目的に沿って行う。
