const CJK_PATTERN = /[\p{scx=Hiragana}\p{scx=Katakana}\p{scx=Han}]/u;

const OPEN_BRACKETS = new Set(["(", "（"]);
const CLOSE_BRACKETS = new Set([")", "）"]);

/**
 * @param {string} text
 * @returns {Array<{ openIndex: number, closeIndex: number, openChar: string, closeChar: string, inner: string }>}
 */
function findBracketPairs(text) {
    const stack = [];
    const pairs = [];

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (OPEN_BRACKETS.has(ch)) {
            stack.push({ char: ch, index: i });
        } else if (CLOSE_BRACKETS.has(ch)) {
            if (stack.length > 0) {
                const open = stack.pop();
                pairs.push({
                    openIndex: open.index,
                    closeIndex: i,
                    openChar: open.char,
                    closeChar: ch,
                    inner: text.slice(open.index + 1, i),
                });
            }
        }
    }

    return pairs;
}

/**
 * DFS で子孫の Str ノードをすべて収集する。
 * Code（インラインコード）は children を持たないため自動的に除外される。
 *
 * @param {object} node
 * @param {object} Syntax
 * @returns {object[]}
 */
function collectStrNodes(node, Syntax) {
    const results = [];
    function dfs(n) {
        if (n.type === Syntax.Str) {
            results.push(n);
            return;
        }
        for (const child of n.children ?? []) {
            dfs(child);
        }
    }
    dfs(node);
    return results;
}

/**
 * Str ノードのテキストを連結して仮想テキストを構築し、
 * 各 UTF-16 code unit の位置からノード・ノード内位置へのマップを作る。
 *
 * getSource(node) を使うことで、fixer.replaceTextRange の相対 index と
 * 一致する（node.value はエスケープ文字等で raw ソースと乖離しうる）。
 *
 * @param {object[]} strNodes
 * @param {(node: object) => string} getSource
 * @returns {{ text: string, posMap: Array<{ nodeIdx: number, indexInNode: number }> }}
 */
function buildVirtualText(strNodes, getSource) {
    let text = "";
    const posMap = [];

    strNodes.forEach((node, nodeIdx) => {
        const src = getSource(node);
        for (let i = 0; i < src.length; i++) {
            posMap.push({ nodeIdx, indexInNode: i });
        }
        text += src;
    });

    return { text, posMap };
}

/**
 * @param {object} node - Paragraph / Header / TableCell ノード
 * @param {{ report, RuleError, fixer, getSource, locator, Syntax }} ctx
 */
function processInlineContainer(node, ctx) {
    const { report, RuleError, fixer, getSource, locator, Syntax } = ctx;

    const strNodes = collectStrNodes(node, Syntax);
    if (strNodes.length === 0) return;

    const { text, posMap } = buildVirtualText(strNodes, getSource);
    const pairs = findBracketPairs(text);

    for (const { openIndex, closeIndex, openChar, closeChar, inner } of pairs) {
        const needsFullwidth = CJK_PATTERN.test(inner);
        const correctOpen = needsFullwidth ? "（" : "(";
        const correctClose = needsFullwidth ? "）" : ")";
        const message = needsFullwidth
            ? "CJK文字を含む括弧は全角（）を使用してください"
            : "CJK文字を含まない括弧は半角()を使用してください";

        if (openChar !== correctOpen) {
            const { nodeIdx, indexInNode } = posMap[openIndex];
            report(
                strNodes[nodeIdx],
                new RuleError(message, {
                    padding: locator.range([indexInNode, indexInNode + 1]),
                    fix: fixer.replaceTextRange([indexInNode, indexInNode + 1], correctOpen),
                })
            );
        }

        if (closeChar !== correctClose) {
            const { nodeIdx, indexInNode } = posMap[closeIndex];
            report(
                strNodes[nodeIdx],
                new RuleError(message, {
                    padding: locator.range([indexInNode, indexInNode + 1]),
                    fix: fixer.replaceTextRange([indexInNode, indexInNode + 1], correctClose),
                })
            );
        }
    }
}

const reporter = (context) => {
    const { Syntax, report, RuleError, fixer, getSource, locator } = context;
    const process = (node) =>
        processInlineContainer(node, { report, RuleError, fixer, getSource, locator, Syntax });
    return {
        [Syntax.Paragraph]: process,
        [Syntax.Header]: process,
        [Syntax.TableCell]: process,
    };
};

export default { linter: reporter, fixer: reporter };
