import TextLintTesterModule from "textlint-tester";
const TextLintTester = TextLintTesterModule.default ?? TextLintTesterModule;
import rule from "../src/index.js";

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
    ],
    invalid: [
        // 半角→全角
        {
            text: "そうです(ただし例外あり)。",
            output: "そうです（ただし例外あり）。",
            errors: [{ message: "CJK文字を含む括弧は全角（）を使用してください" }],
        },
        {
            text: "Node.js(v22 対応)",
            output: "Node.js（v22 対応）",
            errors: [{ message: "CJK文字を含む括弧は全角（）を使用してください" }],
        },
        {
            text: "(日本語のみ)",
            output: "（日本語のみ）",
            errors: [{ message: "CJK文字を含む括弧は全角（）を使用してください" }],
        },
        {
            text: "(あ)",
            output: "（あ）",
            errors: [{ message: "CJK文字を含む括弧は全角（）を使用してください" }],
        },
        {
            text: "(issue が3件)",
            output: "（issue が3件）",
            errors: [{ message: "CJK文字を含む括弧は全角（）を使用してください" }],
        },
        // 全角→半角
        {
            text: "診断情報 （diagnostics） を出す",
            output: "診断情報 (diagnostics) を出す",
            errors: [{ message: "CJK文字を含まない括弧は半角()を使用してください" }],
        },
        {
            text: "API（beta）",
            output: "API(beta)",
            errors: [{ message: "CJK文字を含まない括弧は半角()を使用してください" }],
        },
        {
            text: "（123）",
            output: "(123)",
            errors: [{ message: "CJK文字を含まない括弧は半角()を使用してください" }],
        },
        {
            text: "（）",
            output: "()",
            errors: [{ message: "CJK文字を含まない括弧は半角()を使用してください" }],
        },
        {
            text: "（v22）",
            output: "(v22)",
            errors: [{ message: "CJK文字を含まない括弧は半角()を使用してください" }],
        },
        {
            text: "（β）",
            output: "(β)",
            errors: [{ message: "CJK文字を含まない括弧は半角()を使用してください" }],
        },
        // 入れ子
        {
            text: "(テスト (inner) 結果)",
            output: "（テスト (inner) 結果）",
            errors: [{ message: "CJK文字を含む括弧は全角（）を使用してください" }],
        },
        {
            text: "(日本語（inner）テスト)",
            output: "（日本語(inner)テスト）",
            errors: [
                { message: "CJK文字を含む括弧は全角（）を使用してください" },
                { message: "CJK文字を含まない括弧は半角()を使用してください" },
            ],
        },
        // 連続括弧
        {
            text: "(あ)(def)",
            output: "（あ）(def)",
            errors: [{ message: "CJK文字を含む括弧は全角（）を使用してください" }],
        },
        {
            text: "（abc）（def）",
            output: "(abc)(def)",
            errors: [
                { message: "CJK文字を含まない括弧は半角()を使用してください" },
                { message: "CJK文字を含まない括弧は半角()を使用してください" },
            ],
        },
        // 混在括弧
        {
            text: "(日本語）",
            output: "（日本語）",
            errors: [{ message: "CJK文字を含む括弧は全角（）を使用してください" }],
        },
        {
            text: "（ascii)",
            output: "(ascii)",
            errors: [{ message: "CJK文字を含まない括弧は半角()を使用してください" }],
        },
    ],
});
