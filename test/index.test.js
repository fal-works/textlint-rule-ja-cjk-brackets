import TextLintTesterModule from "textlint-tester";
const TextLintTester = TextLintTesterModule.default ?? TextLintTesterModule;

import rule from "../src/index.js";

const CJK_FULL = "CJK文字を含む括弧は全角（）を使用してください";
const ASCII_HALF = "CJK文字を含まない括弧は半角()を使用してください";

const tester = new TextLintTester();

tester.run("ja-cjk-brackets", rule, {
    valid: [
        // 半角・CJKなし
        "診断情報 (diagnostics) を出す",
        "補助機能 (experimental feature) を有効にする",
        "エラーコード (123) を確認",
        "モダンなバージョン (v22-24) に対応",
        // 全角・CJKあり
        "そうです（ただし例外あり）。",
        "課題多数（issue が3件）あり",
        "Node.js（v22 対応）",
        "API（β版）",
        // 入れ子・両方正しい
        "（テスト (test) 結果）",
        // 連続括弧
        "(abc)(def)",
        "（あ）（い）",
        // β は Greek（非CJK）→ 半角
        "(β)",
        // 括弧なし
        "テキストのみ",
        // 対象外括弧
        "[abc]",
        "【あ】",
        "「い」",
        // 空括弧は CJK なし → 半角
        "()",
        // BMP外文字（絵文字）: CJK 判定に影響しない
        "（😀日本語）",   // 😀 + CJK → 全角 ✓
        "(😀abc)",        // 😀 + non-CJK → 半角 ✓
        // Markdown inline をまたぐ括弧
        "（**日本語**）",  // 全角・CJK あり ✓
        "(**english**)",   // 半角・CJK なし ✓
        "（*日本語*）",            // 全角・CJK あり ✓
        "（*日本語と English*）",  // 全角・CJK あり（混在でも CJK があれば全角）✓
        // インラインコードは内容に関わらず非 CJK 扱い
        "(`日本語`)",   // インラインコードは非 CJK → 半角 ✓
        "(`abc`)",      // インラインコードは非 CJK → 半角 ✓
    ],
    invalid: [
        // ---- 半角→全角 ----
        {
            text: "そうです(ただし例外あり)。",
            output: "そうです（ただし例外あり）。",
            errors: [{ message: CJK_FULL }, { message: CJK_FULL }],
        },
        {
            text: "Node.js(v22 対応)",
            output: "Node.js（v22 対応）",
            errors: [{ message: CJK_FULL }, { message: CJK_FULL }],
        },
        {
            text: "(日本語のみ)",
            output: "（日本語のみ）",
            errors: [{ message: CJK_FULL }, { message: CJK_FULL }],
        },
        {
            text: "(あ)",
            output: "（あ）",
            errors: [{ message: CJK_FULL }, { message: CJK_FULL }],
        },
        {
            text: "(issue が3件)",
            output: "（issue が3件）",
            errors: [{ message: CJK_FULL }, { message: CJK_FULL }],
        },
        // ---- 全角→半角 ----
        {
            text: "診断情報 （diagnostics） を出す",
            output: "診断情報 (diagnostics) を出す",
            errors: [{ message: ASCII_HALF }, { message: ASCII_HALF }],
        },
        {
            text: "API（beta）",
            output: "API(beta)",
            errors: [{ message: ASCII_HALF }, { message: ASCII_HALF }],
        },
        {
            text: "（123）",
            output: "(123)",
            errors: [{ message: ASCII_HALF }, { message: ASCII_HALF }],
        },
        {
            text: "（）",
            output: "()",
            errors: [{ message: ASCII_HALF }, { message: ASCII_HALF }],
        },
        {
            text: "（v22）",
            output: "(v22)",
            errors: [{ message: ASCII_HALF }, { message: ASCII_HALF }],
        },
        {
            text: "（β）",
            output: "(β)",
            errors: [{ message: ASCII_HALF }, { message: ASCII_HALF }],
        },
        // ---- 入れ子 ----
        // 外側のみ誤り（内側は正しい）
        {
            text: "(テスト (inner) 結果)",
            output: "（テスト (inner) 結果）",
            errors: [{ message: CJK_FULL }, { message: CJK_FULL }],
        },
        // 外2 + 内2
        // エラー順: position 昇順 → outer-open(0), inner-open(4), inner-close(10), outer-close(14)
        {
            text: "(日本語（inner）テスト)",
            output: "（日本語(inner)テスト）",
            errors: [
                { message: CJK_FULL },    // outer open  at 0
                { message: ASCII_HALF },  // inner open  at 4
                { message: ASCII_HALF },  // inner close at 10
                { message: CJK_FULL },    // outer close at 14
            ],
        },
        // ---- 連続括弧 ----
        {
            text: "(あ)(def)",
            output: "（あ）(def)",
            errors: [{ message: CJK_FULL }, { message: CJK_FULL }],
        },
        // エラー順: position 昇順 → 1st-open(0), 1st-close(4), 2nd-open(5), 2nd-close(9)
        {
            text: "（abc）（def）",
            output: "(abc)(def)",
            errors: [
                { message: ASCII_HALF },
                { message: ASCII_HALF },
                { message: ASCII_HALF },
                { message: ASCII_HALF },
            ],
        },
        // ---- 混在括弧（開閉で種類が違う）----
        {
            text: "(日本語）",
            output: "（日本語）",
            errors: [{ message: CJK_FULL }],
        },
        {
            text: "（ascii)",
            output: "(ascii)",
            errors: [{ message: ASCII_HALF }],
        },
        // ---- BMP外文字（Finding 1 再現）----
        // 😀 は U+1F600、UTF-16 で 2 code units（サロゲートペア）
        // outer:（）CJK なし→半角、inner:（）CJK なし→半角
        // エラー順: position 昇順
        {
            text: "（😀（abc））",
            output: "(😀(abc))",
            errors: [
                { message: ASCII_HALF },  // outer open  at 0
                { message: ASCII_HALF },  // inner open  at 3 (😀=2 code units → index 3)
                { message: ASCII_HALF },  // inner close at 7
                { message: ASCII_HALF },  // outer close at 8
            ],
        },
        {
            text: "(😀日本語)",
            output: "（😀日本語）",
            errors: [{ message: CJK_FULL }, { message: CJK_FULL }],
        },
        // ---- Markdown inline をまたぐ括弧（Finding 2 再現）----
        {
            text: "（**abc**）",
            output: "(**abc**)",
            errors: [{ message: ASCII_HALF }, { message: ASCII_HALF }],
        },
        {
            text: "(**日本語**)",
            output: "（**日本語**）",
            errors: [{ message: CJK_FULL }, { message: CJK_FULL }],
        },
        {
            text: "(*日本語*)",
            output: "（*日本語*）",
            errors: [{ message: CJK_FULL }, { message: CJK_FULL }],
        },
        // ---- インラインコード（内容に関わらず非 CJK 扱い）----
        {
            text: "（`日本語`）",
            output: "(`日本語`)",
            errors: [{ message: ASCII_HALF }, { message: ASCII_HALF }],
        },
        {
            text: "（`abc`）",
            output: "(`abc`)",
            errors: [{ message: ASCII_HALF }, { message: ASCII_HALF }],
        },
    ],
});
