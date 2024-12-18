// content/content-script.js

let currentLists = [];
let highlighted = false;

(async function () {
    currentLists = await getListsFromBackground();
    applyHighlights();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'listsUpdated') {
            clearHighlights();
            getListsFromBackground().then((lists) => {
                currentLists = lists;
                applyHighlights();
            });
        }
    });
})();

function getListsFromBackground() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "getLists" }, (response) => {
            resolve(response.lists || []);
        });
    });
}

function applyHighlights() {
    const enabledLists = currentLists.filter(l => l.enabled);
    if (enabledLists.length === 0) return;

    const textNodes = getTextNodesUnder(document.body);
    for (const textNode of textNodes) {
        const originalText = textNode.nodeValue;
        if (!originalText.trim()) continue;
        const replacedNode = highlightText(originalText, enabledLists);
        if (replacedNode && replacedNode !== textNode) {
            textNode.parentNode.replaceChild(replacedNode, textNode);
        }
    }
    highlighted = true;
}

function clearHighlights() {
    if (!highlighted) return;
    const highlightedElems = document.querySelectorAll('.word-highlight');
    highlightedElems.forEach(elem => {
        const originalText = elem.getAttribute('data-original');
        const textNode = document.createTextNode(originalText);
        elem.parentNode.replaceChild(textNode, elem);
    });
    highlighted = false;
}

/////////////// content/highlight.js ///////////////

function applyHighlightStyle(elem, style) {
    if (style.color) elem.style.color = style.color;
    if (style.backgroundColor) elem.style.backgroundColor = style.backgroundColor;
    if (style.fontWeight) elem.style.fontWeight = style.fontWeight;
    if (style.textDecoration && style.textDecoration !== 'none') {
        elem.style.textDecoration = style.textDecoration;
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMatchingList(word, combinedWords) {
    for (let cw of combinedWords) {
        let { list, word: listWord } = cw;
        const compare = list.matchRules.ignoreCase ? word.toLowerCase() : word;
        const target = list.matchRules.ignoreCase ? listWord.toLowerCase() : listWord;
        if (compare === target) return list;
    }
    return null;
}

function getTextNodesUnder(el) {
    const excludedTags = ["script", "style", "textarea", "input", "code", "pre"];
    const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parentTag = node.parentNode.tagName.toLowerCase();
                if (excludedTags.includes(parentTag)) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (!node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        },
        false
    );
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
}

function highlightText(text, lists) {
    const combinedWords = [];
    for (let list of lists) {
        for (let w of list.words) {
            combinedWords.push({ word: w, list });
        }
    }

    if (combinedWords.length === 0) return null;

    combinedWords.sort((a, b) => b.word.length - a.word.length);

    let currentText = text;
    for (let { word, list } of combinedWords) {
        let flags = list.matchRules.ignoreCase ? "gi" : "g";
        let regexWord = escapeRegExp(word);
        let regex = new RegExp(`\\b${regexWord}\\b`, flags);
        currentText = currentText.replace(regex, (match) => `\uE000${match}\uE001`);
    }

    if (currentText === text) return null;

    const fragment = document.createDocumentFragment();
    const parts = currentText.split(/(\uE000.*?\uE001)/);

    parts.forEach(part => {
        if (part.match(/\uE000.*?\uE001/)) {
            const raw = part.replace(/\uE000|\uE001/g, '');
            const matchedList = findMatchingList(raw, combinedWords);
            const span = document.createElement("span");
            span.className = 'word-highlight';
            span.setAttribute('data-original', raw);
            if (matchedList) {
                applyHighlightStyle(span, matchedList.highlightStyle);
            }
            span.textContent = raw;
            fragment.appendChild(span);
        } else {
            fragment.appendChild(document.createTextNode(part));
        }
    });

    return fragment;
}
