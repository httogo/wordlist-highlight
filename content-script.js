(async function() {
  const lists = await getListsFromStorage();
  const enabledLists = lists.filter(l => l.enabled);

  if (enabledLists.length === 0) {
    return; // 无启用列表则无需处理
  }

  // 遍历页面文本节点
  const textNodes = getTextNodesUnder(document.body);

  // 对页面的文本进行匹配与高亮
  textNodes.forEach(textNode => {
    const originalText = textNode.nodeValue;
    if (!originalText.trim()) return;

    const replacedNode = highlightText(originalText, enabledLists);
    if (replacedNode && replacedNode !== textNode) {
      textNode.parentNode.replaceChild(replacedNode, textNode);
    }
  });

  // 从存储中获取列表
  function getListsFromStorage() {
    return new Promise(resolve => {
      chrome.storage.local.get(["lists"], (res) => {
        resolve(res.lists || []);
      });
    });
  }

  // 获取所有文本节点
  function getTextNodesUnder(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    return nodes;
  }

  // 高亮文本中的匹配单词
  function highlightText(text, lists) {
    // 构建匹配单词集合
    const combinedWords = [];
    for (let list of lists) {
      for (let w of list.words) {
        combinedWords.push({word: w, list});
      }
    }

    if (combinedWords.length === 0) return null;

    // 将文本分片匹配，为减少冲突可先按单词长度排序
    combinedWords.sort((a,b) => b.word.length - a.word.length);

    // 使用特殊标记进行替换，然后再分割创建元素
    let currentText = text;
    for (let {word, list} of combinedWords) {
      let flags = list.matchRules.ignoreCase ? "gi" : "g";
      let regexWord = escapeRegExp(word);
      let regex = new RegExp(`\\b${regexWord}\\b`, flags);
      currentText = currentText.replace(regex, (match) => `\uE000${match}\uE001`);
    }

    if (currentText === text) {
      return null; // 无匹配
    }

    const fragment = document.createDocumentFragment();
    const parts = currentText.split(/(\uE000.*?\uE001)/);

    parts.forEach(part => {
      if (part.match(/\uE000.*?\uE001/)) {
        const raw = part.replace(/\uE000|\uE001/g, '');
        const matchedList = findMatchingList(raw, combinedWords);
        const span = document.createElement("span");
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
    // 理论上一定能找到匹配的list，这里fallback第一个以防万一
    return combinedWords[0].list;
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
})();
