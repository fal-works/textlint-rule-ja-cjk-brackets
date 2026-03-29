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
 * Build the corrected replacement text for a bracket pair.
 * Also corrects any nested bracket pairs within the span.
 * Since '(' (U+0028) and '（' (U+FF08) are both 1 code unit, replacements
 * do not shift positions of other characters.
 *
 * @param {string} text - original full text of the node
 * @param {ReturnType<typeof findBracketPairs>} allPairs - all pairs in the node
 * @param {number} openIndex
 * @param {number} closeIndex
 * @param {boolean} needsFullwidth
 * @returns {string}
 */
function buildFixedText(text, allPairs, openIndex, closeIndex, needsFullwidth) {
    const chars = [...text.slice(openIndex + 1, closeIndex)];
    const offset = openIndex + 1;

    // Apply corrections to any nested bracket pairs within this span
    for (const pair of allPairs) {
        if (pair.openIndex > openIndex && pair.closeIndex < closeIndex) {
            const pairNeedsFull = CJK_PATTERN.test(pair.inner);
            chars[pair.openIndex - offset] = pairNeedsFull ? "（" : "(";
            chars[pair.closeIndex - offset] = pairNeedsFull ? "）" : ")";
        }
    }

    const correctOpen = needsFullwidth ? "（" : "(";
    const correctClose = needsFullwidth ? "）" : ")";
    return correctOpen + chars.join("") + correctClose;
}

const reporter = (context) => {
    const { Syntax, report, RuleError, fixer, getSource, locator } = context;
    return {
        [Syntax.Str](node) {
            const text = getSource(node);
            const pairs = findBracketPairs(text);

            for (const { openIndex, closeIndex, openChar, closeChar, inner } of pairs) {
                const needsFullwidth = CJK_PATTERN.test(inner);
                const correctOpen = needsFullwidth ? "（" : "(";
                const correctClose = needsFullwidth ? "）" : ")";

                if (openChar === correctOpen && closeChar === correctClose) continue;

                const fixedText = buildFixedText(text, pairs, openIndex, closeIndex, needsFullwidth);

                report(
                    node,
                    new RuleError(
                        needsFullwidth
                            ? "CJK文字を含む括弧は全角（）を使用してください"
                            : "CJK文字を含まない括弧は半角()を使用してください",
                        {
                            padding: locator.range([openIndex, openIndex + 1]),
                            fix: fixer.replaceTextRange(
                                [openIndex, closeIndex + 1],
                                fixedText
                            ),
                        }
                    )
                );
            }
        },
    };
};

export default { linter: reporter, fixer: reporter };
