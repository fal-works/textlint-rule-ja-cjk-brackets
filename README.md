# textlint-rule-ja-cjk-brackets

括弧内に CJK 文字（ひらがな・カタカナ・漢字）が含まれる場合は全角括弧 `（）` を、それ以外の場合は半角括弧 `()` を使用することを要求する [textlint](https://textlint.github.io/) ルールです。

`--fix` に対応しています。

## インストール

```sh
npm install --save-dev textlint textlint-rule-ja-cjk-brackets
```

## 使い方

`.textlintrc.json`:

```json
{
  "rules": {
    "ja-cjk-brackets": true
  }
}
```

## ルール

| 入力 | 結果 | 理由 |
|------|------|------|
| `診断情報 (diagnostics) を出す` | OK | 半角・CJK なし |
| `そうです（ただし例外あり）。` | OK | 全角・CJK あり |
| `そうです(ただし例外あり)。` | Error | CJK あり → 全角 `（）` が必要 |
| `診断情報 （diagnostics） を出す` | Error | CJK なし → 半角 `()` が必要 |

### CJK 判定

括弧内テキストに `/[\p{scx=Hiragana}\p{scx=Katakana}\p{scx=Han}]/u` がマッチするかで判定します。

- ひらがな・カタカナ・漢字を含む → 全角 `（）`
- それ以外（ASCII、数字、ギリシャ文字など）→ 半角 `()`

### 入れ子括弧

入れ子括弧はそれぞれ独立して判定されます。

```
（テスト (test) 結果）  →  OK（外：CJK あり → 全角、内：CJK なし → 半角）
(テスト (inner) 結果)  →  外だけ Error → （テスト (inner) 結果）
```

## 対象括弧

`(` (U+0028) / `)` (U+0029) および `（` (U+FF08) / `）` (U+FF09) のみが対象です。`[`、`【`、`「` などは対象外です。

## ライセンス

MIT
