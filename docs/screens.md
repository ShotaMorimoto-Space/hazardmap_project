# Screen Design — AI Disaster Map V1.0

## 1. Purpose

本ドキュメントは、V1.0の主要画面構成、画面遷移、Map Creatorの操作項目、およびPC / Mobileでの基本レイアウト方針を定義する。

V1.0では、複雑な多画面構成を避け、ユーザーが「自宅住所を入力 → 自分専用のハザードマップを作成 → 商品仕様を選択 → 購入」まで迷わず進めることを優先する。

---

## 2. Product Positioning Assumption

Core Concept:

**飾るハザードマップ**

Screen Designは、単なる防災情報ツールではなく、日常的に部屋へ飾りたくなる商品を作る体験として設計する。

現時点の仮コピー:

### Primary Copy

**「もしもの時、ここに行こうね」を、いつもの景色に。**

### Supporting Copy

自宅を中心に、避難所や家族にとって大切な場所を一枚の地図に。

普段から部屋に飾っておくことで、防災について特別な勉強をしなくても、子どもと自然に避難場所や行動を共有できます。

※コピー文章、ペルソナ、ブランドトーンは今後ブラッシュアップする。現時点では画面設計の前提として仮置きとする。

---

## 3. Main Screen Flow

```text
[ Screen 1 ]
Landing / Product Page
        ↓
[ Screen 2 ]
Map Creator
  ├─ 初回：住所入力
  └─ 住所確定後：Customizer表示
        ↓
[ Screen 3 ]
Product Configuration
        ↓
[ Shopify Checkout ]
        ↓
[ Screen 4 ]
Order Complete
```

住所入力とMap Customizerは別ページに分離せず、同一のMap Creator画面内で連続した体験とする。

---

# 4. Screen 1 — Landing / Product Page

## Purpose

サービスの価値を伝え、ユーザーに自宅専用マップの作成を開始してもらう。

防災機能の説明を前面に出しすぎず、「日常的に飾れる自分専用のハザードマップ」という価値を直感的に伝える。

## Primary UI

- Hero Visual
  - 完成したポスター / フレーム商品のイメージ
- Primary Copy
- Supporting Copy
- Main CTA
  - `自宅のマップをつくる`
- 商品特徴
- 作成フロー説明
- デザイン例
- 再CTA

## Recommended Content Order

```text
Hero
↓
完成商品イメージ
↓
3 Step説明
  1. 住所を入力
  2. 家族のマップをつくる
  3. ポスターとして届く
↓
主な機能
  ・自宅中心の地図
  ・防災情報
  ・避難所
  ・家族の場所
  ・Layout
  ・Map Style
↓
商品 / デザイン例
↓
CTA
```

---

# 5. Screen 2 — Map Creator

Map CreatorはV1.0の中心画面とする。

同じ画面内で、初回住所入力からMap Customizerまで連続して操作できるようにする。

## 5.1 Initial State — Address Input

ユーザーがMap Creatorへ初めてアクセスした場合、最初に住所入力UIを表示する。

### UI

```text
あなたの家を中心にマップを作ります

[ 住所を入力 ]

[ マップを作る ]
```

### Behavior

```text
住所入力
↓
Geocoding
↓
緯度・経度取得
↓
自宅中心のMap生成
↓
Customizer表示
```

無効な住所の場合は、ユーザーが修正できるエラー表示を行う。

## 5.2 Address Re-entry

住所確定後も、Map Creator内から住所を再入力できるようにする。

Customizer上部に現在の住所を表示し、`変更` 操作を提供する。

### Example

```text
LOCATION
兵庫県伊丹市○○...
[ 変更 ]
```

### Address Change Behavior

```text
住所再入力
↓
Geocoding
↓
Map center更新
↓
自宅位置更新
↓
Hazard Data再取得
↓
Shelter Data再取得
↓
Preview更新
```

---

# 6. Map Customizer Structure

Customizerの設定項目は、以下の順番を基本とする。

```text
1. Location
2. Layout
3. Title
4. Map Style
5. Map Position / Zoom
6. Hazard Layer
7. Shelter
8. Family Places
```

ユーザーは設定変更の結果をリアルタイムでPreview確認できる。

## 6.1 Location

- 現在の住所表示
- 住所変更

住所変更時は自宅、Hazard、Shelter情報を再計算する。

## 6.2 Layout

Layoutは、地図の色や道路デザインではなく、**完成ポスター全体の構図**を意味する。

V1.0では複数の固定Layoutから選択可能とする。

### Initial Layout Concepts

#### Layout A — Full Map
- 全面Map
- タイトルなしを基本とする

#### Layout B — Map + Bottom Title
- 地図
- 下部タイトル領域

#### Layout C — Circle Map
- 円形Map
- 余白
- タイトル領域

#### Layout D — Map + Wide Margin
- 地図
- 広めの余白
- タイトル領域

※具体的なLayout数、余白比率、タイトル位置などはPhase 3で確定する。

## 6.3 Title

Layoutによってタイトル表示領域を持つ。

ユーザーはタイトル文字列を編集できる。

### V1.0 Functions

- タイトル文字列入力
- タイトル表示 / 非表示
- Layoutに応じた所定位置への自動配置
- Previewへのリアルタイム反映
- 印刷データへの反映

### Out of Scope

- フォントの自由選択
- フォントサイズ自由変更
- テキストの自由移動
- 複数テキストボックス追加
- 高度な文字装飾

## 6.4 Map Style

Map StyleはMapboxの地図デザインを意味する。

Layoutとは独立して選択する。

### Initial Style Concepts

- Minimal
- Natural
- Modern
- Family / Kids

### Functions

- Style切替
- Previewへリアルタイム反映
- Hazard / Shelter / Home / Family PlacesをStyle上に表示
- 最終印刷データへ反映

## 6.5 Map Position / Zoom

ユーザーは地図の表示位置と表示範囲を調整できる。

### Functions

- 地図ドラッグによる位置移動
- Zoom In
- Zoom Out
- マウスホイールZoom
- Touch Pinch Zoom
- Previewへリアルタイム反映

最終Map設定として少なくとも以下を保持する。

```text
center_lat
center_lng
zoom
```

## 6.6 Hazard Layer

- なし
- 洪水
- 土砂災害
- 津波

同時表示は最大1種類とする。

## 6.7 Shelter

避難所はHazard Layerと独立してON / OFF可能とする。

## 6.8 Family Places

UI上では `Custom Marker` を前面に出さず、家族にとって意味のある場所を追加する機能として表現する。

仮UI名:

**家族の場所**

### Functions

- `＋ 地図に場所を追加`
- 地図クリック / タップで追加
- 複数追加
- 削除
- Previewへリアルタイム反映
- 最終印刷データへ反映

### V1.0 Out of Scope

- 場所名称入力
- メモ入力
- 自動ルート
- 最短経路検索
- GPS Navigation
- リアルタイム位置共有

---

# 7. PC Layout

PCでは、CustomizerとPreviewを横並びにする。

```text
┌──────────────────────┬─────────────────────────────┐
│ CUSTOMIZER           │                             │
│ Location             │                             │
│ Layout               │                             │
│ Title                │       LIVE PREVIEW          │
│ Map Style            │                             │
│ Map Position / Zoom  │                             │
│ Hazard               │                             │
│ Shelter              │                             │
│ Family Places        │                             │
├──────────────────────┴─────────────────────────────┤
│                                        [ 次へ ]     │
└────────────────────────────────────────────────────┘
```

### Principle

- 左側 = 設定
- 右側 = 商品Preview
- 設定変更は即時Preview反映
- Preview自体を直接ドラッグ / Zoom可能
- 「GISを操作している感覚」ではなく、「ポスターをデザインしている感覚」を与える

---

# 8. Mobile Layout

Mobileでは横並びにせず、PreviewとCustomizerを縦方向に配置する。

```text
MAP PREVIEW
────────────

Location
Layout
Title
Map Style
Map Position / Zoom
Hazard
Shelter
Family Places

────────────
[ 次へ ]
```

### Principle

- Previewを上部に配置
- 設定操作結果がすぐ確認できる
- TouchでMap移動 / Pinch Zoom
- 操作UIを縦スクロール可能にする
- PCと機能差を極力作らない

Sticky Previewまたは一部固定表示は実装段階でUXを検証する。

---

# 9. Screen 3 — Product Configuration

Map作成完了後、商品仕様を選択する。

Map Creatorとは別画面とする。

### Functions

- 完成Map Preview
- サイズ選択
  - A2
  - A1
- フレーム選択
  - なし
  - あり
- 商品価格表示
- カート追加

### UX Principle

```text
まずマップを作る
↓
完成したマップを見る
↓
商品仕様を選ぶ
↓
購入する
```

Customizerへ商品サイズ、フレーム、価格を詰め込みすぎず、Map作成体験へ集中させる。

---

# 10. Shopify Checkout

Cart / Checkout / PaymentはShopifyを利用する。

V1.0では独自Checkout UIを作らない。

---

# 11. Screen 4 — Order Complete

決済成功後、注文完了画面を表示する。

```text
ご注文ありがとうございます。

あなたのマップを製作します。

[ 注文内容を確認 ]
```

---

# 12. Screen Design Principles

## 12.1 Poster First
ユーザーが作成しているのは単なる地図ではなく、部屋に飾るポスターである。

## 12.2 Real-time Preview
変更結果は可能な限り即時Previewへ反映する。

## 12.3 Simple Controls
Layout、Map Style、Hazard Layerなどは原則として定義済み選択肢から選ぶ。

## 12.4 Family Friendly
専門用語を避け、子どもがいる家庭でも直感的に理解できるUI文言を利用する。

## 12.5 Disaster Information Is Optional
Hazard Layerを必須表示にしない。必要な防災情報のみ選択できることでインテリア性を維持する。

---

# 13. V1.0 Screen List

| Screen | Purpose |
|---|---|
| Landing / Product Page | 商品価値を理解しMap作成を開始する |
| Map Creator | 住所入力とMap Customizationを行う |
| Product Configuration | サイズ・フレーム・価格を決める |
| Shopify Checkout | 購入・決済 |
| Order Complete | 注文完了を伝える |

---

# 14. Day 2 Decision Summary

1. Landing / Product PageからMap Creatorへ進む
2. 住所入力とCustomizerを同一Map Creator画面内で扱う
3. Customizer内から住所再入力を可能にする
4. LayoutとMap Styleを別概念として扱う
5. Layoutは複数の固定構成から選択する
6. Layoutに応じてタイトルを表示し、ユーザーが文字列を編集できる
7. 地図の位置移動とZoomを可能にする
8. Hazard / Shelter / Family PlacesをCustomizerで設定する
9. PCでは左Customizer / 右Preview
10. Mobileでは上Preview / 下Customizer
11. Map作成と商品仕様選択を別画面に分離する
12. Product ConfigurationでA2 / A1、フレーム有無、価格を選ぶ
13. CheckoutはShopifyを利用する

---

# 15. Remaining Design Decisions

- 正式なペルソナ
- 正式なブランドコピー
- ブランドカラー
- UIデザインテイスト
- Layoutの正式数
- 各Layoutの具体的構図
- Titleの初期値
- Mapbox Styleの正式数
- Mapbox Styleの色 / フォント / 地図レイヤー構成
- Mobile Sticky Previewの詳細
- Family PlacesのMarker visual
- Product Previewのモックアップ表現
