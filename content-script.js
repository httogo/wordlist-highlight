let currentLists = []; // 存储当前启用列表
let highlighted = false; // 标记当前是否已高亮，用于判断是否需要清除

(async function () {
  currentLists = await getListsFromBackground();
  applyHighlights();

  // 监听列表更新消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'listsUpdated') {
      // 当列表更新时:
      // 1. 清除现有高亮
      // 2. 重新从存储获取最新列表
      // 3. 再次执行高亮
      clearHighlights();
      getListsFromBackground().then((lists) => {
        currentLists = lists;
        applyHighlights();
      });
    }
  });
})();

// 获取列表数据
function getListsFromBackground() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "getLists" }, (response) => {
      resolve(response.lists || []);
    });
  });
}

// 应用高亮
function applyHighlights() {
  const enabledLists = currentLists.filter(l => l.enabled);
  if (enabledLists.length === 0) return;

  const textNodes = getTextNodesUnder(document.body);
  for (const textNode of textNodes) {
    const originalText = textNode.nodeValue;
    if (!originalText.trim()) continue;

    // highlightText 将返回一个 DocumentFragment 或 null
    // 并在匹配单词处使用 <span class="word-highlight" data-original="..."> 包裹
    const replacedNode = highlightText(originalText, enabledLists);
    if (replacedNode && replacedNode !== textNode) {
      textNode.parentNode.replaceChild(replacedNode, textNode);
    }
  }
  highlighted = true;
}

// 清除高亮，恢复原状
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

// 获取所有文本节点
function getTextNodesUnder(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  return nodes;
}

// 高亮文本
function highlightText(text, lists) {
  const combinedWords = [];
  for (let list of lists) {
    for (let w of list.words) {
      combinedWords.push({ word: w, list });
    }
  }

  if (combinedWords.length === 0) return null;

  // 按长度排序，以避免短词影响长词匹配
  combinedWords.sort((a, b) => b.word.length - a.word.length);

  let currentText = text;
  for (let { word, list } of combinedWords) {
    let flags = list.matchRules.ignoreCase ? "gi" : "g";
    let regexWord = escapeRegExp(word);
    let regex = new RegExp(`\\b${regexWord}\\b`, flags);
    currentText = currentText.replace(regex, (match) => `\uE000${match}\uE001`);
  }

  if (currentText === text) {
    return null; // 没有匹配不做处理
  }

  const fragment = document.createDocumentFragment();
  const parts = currentText.split(/(\uE000.*?\uE001)/);

  parts.forEach(part => {
    if (part.match(/\uE000.*?\uE001/)) {
      const raw = part.replace(/\uE000|\uE001/g, '');
      const matchedList = findMatchingList(raw, combinedWords);
      const span = document.createElement("span");
      span.className = 'word-highlight';
      span.setAttribute('data-original', raw);
      applyHighlightStyle(span, matchedList.highlightStyle);
      span.textContent = raw;
      fragment.appendChild(span);
    } else {
      fragment.appendChild(document.createTextNode(part));
    }
  });

  return fragment;
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
