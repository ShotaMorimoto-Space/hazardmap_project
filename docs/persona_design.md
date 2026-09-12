# Persona & Design Direction — AI Disaster Map V1.0

## 1. Purpose

本ドキュメントは、V1.0におけるPrimary Persona、購入トリガー、ブランドデザイン方針、Web UI、ポスター、Mapbox Styleの基本ルールを定義する。

本サービスのCore Conceptは以下とする。

**飾るハザードマップ**

単なる防災情報ツールではなく、日常のインテリアとして自然に飾れ、家族が普段から目にすることで、防災や避難行動について自然に共有できる商品を目指す。

---

# 2. Primary Persona

## 2.1 Persona Definition

30〜40代の夫婦で、未就学〜小学生の子どもが1〜2人いる家庭。

戸建て・マンションは問わないが、住空間を整えることに関心があり、

- 家具
- 雑貨
- ポスター
- 観葉植物
- 収納
- 子ども用品

などについて「機能だけでなく、見た目も大切」と考える。

防災意識はゼロではないが、防災を趣味のように積極的に学んでいる層ではない。

自治体のハザードマップを受け取った経験はあるものの、

- どこに置いたか分からない
- 情報量が多い
- 自宅がどこか分かりにくい
- 子どもには難しい

と感じている。

一方で、子どもが成長して親と離れて行動する時間が増えるにつれ、

- 地震が起きたらどこへ行くのか
- 学校や習い事の途中だったらどうするのか
- 家族が別々の場所にいる時、どこで合流するのか

といった不安を感じ始める。

---

## 2.2 Core Need

Primary Personaが本当に欲しいのは、

**ハザードマップそのものではない。**

本当の欲求は、

**家族の防災について、ちゃんと話しておきたい。  
でも、防災を特別な勉強や重いイベントにはしたくない。**

ことである。

そのため本サービスでは、

**「家に飾れる地図を作ったら、その中に家族に必要な防災情報も自然に入っていた」**

という体験を提供する。

---

## 2.3 Ideal User Experience

理想的な利用シーンは以下。

```text
親が自宅を中心にマップを作る
↓
避難所や必要な防災情報を表示する
↓
家族にとって重要な場所へマーカーを追加する
↓
子どもと一緒に地図を見る
↓
「ここがおうち」
「地震があったらここに行こうね」
などを自然に話す
↓
完成したポスターをリビングに飾る
↓
日常的に繰り返し目にする
```

商品価値は、購入時だけではなく、**飾った後の日常の中で継続して生まれる**。

---

# 3. Purchase Triggers

## 3.1 Highest Priority

### 1. 新築・住宅購入
新しい住環境で、周辺地域・避難所・災害リスクを把握したいタイミング。インテリア購入需要とも重なる。

### 2. 引っ越し
新しい地域についてまだ詳しくないため、自宅周辺の位置関係と防災情報を整理する理由が自然に発生する。

### 3. 子どもの入園・入学
子どもが親から離れて行動する時間が増える。家庭内で学校・自宅・避難所・家族の集合場所などを話すきっかけになる。

## 3.2 Secondary Priority

### 4. 子どもが一人で通学・習い事を始める
親と一緒ではない時間の災害を考えるきっかけになる。

### 5. 家族で防災用品を見直した時
防災バッグや備蓄品とあわせて、避難場所や行動について見直すタイミング。

## 3.3 Seasonal / News Driven

### 6. 防災の日・震災報道
防災意識が一時的に高まるタイミング。広告・SNS・コンテンツ施策との相性が良い。

## 3.4 Low Priority

### 7. 新築祝い・引っ越し祝いなどのギフト需要
V1.0では低優先度とする。

本サービスは、**購入者自身が自宅住所や家族に必要な情報を設定し、自分たちの地図を作る体験**に価値があるため、完成品を他人から贈られるギフトモデルとは相性がやや弱い。

将来的にB2B展開が進んだ場合、オフィス・店舗・学校・施設などで、担当者が利用者のために作成するモデルに近い需要が生まれる可能性がある。

---

# 4. Brand Direction

## 4.1 Main Design Direction

**Soft Family Nordic**

見た目は北欧系インテリア。

使うと家族向け防災。

このバランスをV1.0のメインデザイン方向とする。

## 4.2 Brand Keywords

- やさしい
- あたたかい
- 日常的
- 安心
- 親しみ
- シンプル
- 暮らしになじむ
- 子どもにも分かりやすい

## 4.3 Design Balance

目安として以下のバランスを意識する。

```text
Soft Nordic / Interior        70%
Family Friendly               20%
Disaster / Safety             10%
```

---

# 5. Visual Direction

## 5.1 Base Color Palette

### Background
- Off White: `#FAF8F4`
- Warm White: `#F5F1E8`
- Light Sand: `#EEE8DE`

### Neutral
- Warm Gray: `#D8D2C8`
- Soft Taupe: `#A8A096`
- Charcoal: `#4C4944`

### Primary Accent
- Sage Green: `#AAB9A5`
- Deep Sage: `#8FA28A`

### Secondary Accent
- Muted Blue: `#A9BBC5`
- Deep Muted Blue: `#879EAA`

### Family Accent
- Soft Terracotta: `#D8B2A3`
- Light Peach: `#E6C7B9`

## 5.2 Color Principle

色数を増やしすぎない。

1画面・1ポスター内では、Base / Neutral / Primary Accent / 必要なSafety Color程度に抑える。

「北欧インテリア」と「子ども向け教材」の境界を越えないこと。

---

# 6. Safety / Hazard Color Rule

Hazard情報はインテリア性よりも判別性を優先する。

- Hazard Layer以外では原色の赤・黄を常用しない
- Hazard表示部分では危険度を正しく判別できるコントラストを確保する
- デザイン性を理由に危険度の差を曖昧にしない
- 行政・公式データの意味を変更しない
- 色だけでなくLegend / Labelでも意味を伝える

Hazardカラーの詳細は、採用する公式データ仕様を確認後に確定する。

---

# 7. Typography

## 7.1 UI Font
第一候補: **Noto Sans JP**

- 日本語で読みやすい
- UIとの相性が良い
- 過度に個性的ではない
- Family向けでも幼く見えない

## 7.2 Poster Title
V1では可読性と実装容易性を優先し、基本は **Noto Sans JP**。

必要に応じてPhase 3以降でSerif / Rounded SansなどをStyleごとに検証する。

V1.0ではユーザーによるフォント自由選択は提供しない。

## 7.3 Typography Principle
- 子ども向けフォントを使いすぎない
- 丸文字・手書き文字を多用しない
- 細すぎるFont Weightを避ける
- Titleは短く
- Bodyは読みやすさ優先

---

# 8. UI Design Rules

## 8.1 Shape
- Card / Buttonは軽い角丸
- 過度に丸くしない
- アイコンはシンプル
- Shadowは弱くする
- Border Radius目安: 8px - 12px

## 8.2 Button
Primary CTAは強すぎる原色を避け、Sage Greenを基本候補とする。

CTA例:
- 自宅のマップをつくる
- マップを作る
- 次へ
- カートに追加

## 8.3 Card
Layout / Map Style選択は文字だけではなく、**小さなPreview Thumbnail**を使用する。

## 8.4 Icon
Home / Shelter / Family Placesは視認性を少し高める。

非常口・警告三角形・サイレンなどの強い防災アイコンをUI全体へ大量使用しない。

---

# 9. Map Design Direction

## 9.1 General Principle
Mapbox Styleは、**情報量を減らして、ポスターとして見やすい地図**を目指す。

標準地図をそのまま使用しない。

## 9.2 Base Map
- 背景はWarm White / Light Beige
- RoadはSoft Gray
- Main Roadのみ少し強調
- Buildingは淡く
- WaterはMuted Blue
- ParkはMuted Sage
- POIは必要最低限
- 地名表示は整理
- 過剰な商業施設アイコンは非表示

## 9.3 Information Hierarchy

```text
1. Home
2. Shelter
3. Family Places
4. Hazard Layer
5. Main Road / Railway
6. Place Names
7. Building / Minor Map Detail
```

Hazard Layer表示時は、安全情報として必要な判読性を確保する。

---

# 10. Initial Mapbox Style Candidates

## Style A — Soft Nordic
メインStyle。
Warm White / Warm Gray / Muted Blue / Sage Green。

## Style B — Nordic Minimal
より情報量を減らしたスタイル。
Off White / Gray / Dark Charcoal。

## Style C — Soft Family
Soft Nordicをベースに、Home / Shelter / Family Placesの視認性を少し上げる。

## Style D — Natural
Park / Waterなどの自然要素を少し強める。

※V1.0で4種類すべて実装することを確定するものではない。Phase 3で工数と品質を見て最終決定する。

---

# 11. Poster Layout Direction

- Layout A — Full Map
- Layout B — Map + Bottom Title
- Layout C — Circle Map
- Layout D — Wide Margin

LayoutはMap Styleとは別概念として扱う。

---

# 12. Title Design

Titleはユーザー編集可能。

例:

```text
OUR HOME
ITAMI
MORIMOTO FAMILY
OUR TOWN
```

日本語も入力可能。

```text
わたしたちのまち
わが家のマップ
伊丹
```

V1.0では文字入力と表示 / 非表示のみユーザー操作可能とする。

フォント、サイズ、位置はLayout側で制御する。

---

# 13. Marketing Visual Direction

LPの写真・Mockupは、**実際の家の中に飾られている状態**を中心にする。

好ましいシーン:
- リビング
- ダイニング
- 子どものいる家
- 木製家具
- 白 / ベージュ壁
- 観葉植物
- シンプルなフレーム
- 親子で地図を指差している場面

避ける表現:
- 災害現場写真
- 津波 / 火災の恐怖訴求
- 強い不安煽り
- 防災用品だらけの写真
- 行政資料風デザイン

---

# 14. Temporary Brand Copy

## Primary Copy
**「もしもの時、ここに行こうね」を、いつもの景色に。**

## Supporting Copy
自宅を中心に、避難所や家族にとって大切な場所を一枚の地図に。

普段から部屋に飾っておくことで、防災について特別な勉強をしなくても、子どもと自然に避難場所や行動を共有できます。

コピーはV1ローンチ前に改めて検証・ブラッシュアップする。

---

# 15. Do / Don't

## Do
- インテリアとして成立させる
- 家族にやさしい
- 情報を整理する
- 余白を使う
- 地図を主役にする
- 子どもにも視覚的に分かりやすくする
- 防災情報の正確性を守る

## Don't
- 子ども向け教材に見せる
- 防災ポスター感を強くする
- 原色を多用する
- 情報を詰め込む
- 警告アイコンを多用する
- 危険情報をデザイン優先で分かりにくくする
- 自由編集機能を増やしすぎる

---

# 16. Day 3 Decision Summary

1. Primary Personaは30〜40代・未就学〜小学生の子どもがいる家庭
2. 防災意識はあるが、日常的に防災情報を確認している層ではない
3. 商品価値は「防災を学ぶ」より「日常の中で自然に家族で共有する」
4. 購入トリガー最優先は、新築 / 住宅購入、引っ越し、子どもの入園 / 入学
5. 次点は、一人で通学 / 習い事を始める、防災用品見直し
6. 防災の日・震災報道はSeasonal Trigger
7. ギフト需要はV1.0では低優先度
8. Brand Design Directionは **Soft Family Nordic**
9. 見た目は北欧インテリア、使うと家族向け防災を目指す
10. Warm White / Beige / Sage / Muted Blueを基本色とする
11. UI FontはNoto Sans JPを第一候補とする
12. UIは軽い角丸と余白を重視
13. Mapbox Styleは情報量を整理した淡いデザインを基本とする
14. Home / Shelter / Family Placesは視認性を少し高める
15. Hazard情報はデザイン性より正確な判読性を優先する
16. 正式コピーはまだ確定せず仮置きとする

---

# 17. Remaining Decisions

- 正式ブランド名
- 正式ロゴ
- 正式コピー
- カラーコード最終確定
- Web Font最終確定
- Mapbox Style詳細
- Hazard Color Rule
- Marker Icon Design
- Layout詳細
- Product Mockup
- Print用Typography
