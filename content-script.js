(async function() {
  // 获取列表配置
  const lists = await getListsFromStorage();
  const enabledLists = lists.filter(l => l.enabled);

  if (enabledLists.length === 0) {
    return; // 没有启用的列表则不进行操作
  }

  // 获取网页中的文本节点并高亮匹配词汇
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node;
  const textNodes = [];
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  // 对所有启用列表进行匹配
  for (const textNode of textNodes) {
    let originalText = textNode.nodeValue;
    if (!originalText.trim()) continue;

    let replacedNode = highlightText(originalText, enabledLists);
    if (replacedNode && replacedNode !== textNode) {
      textNode.parentNode.replaceChild(replacedNode, textNode);
    }
  }

  // 获取列表数据
  function getListsFromStorage() {
    return new Promise(resolve => {
      chrome.storage.local.get(["lists"], (res) => {
        resolve(res.lists || []);
      });
    });
  }

  // 根据列表配置高亮文本
  function highlightText(text, lists) {
    // 对文本进行词形还原处理（如果列表要求）
    // 简化逻辑，这里不对全文进行词形还原，只在匹配时对比lemma
    // 实际可先对整句进行 lemma 处理，再根据 lemma匹配

    // 构建用于分割的正则，包含所有列表中的单词
    let combinedWords = [];
    for (let list of lists) {
      for (let w of list.words) {
        combinedWords.push({word: w, list});
      }
    }

    if (combinedWords.length === 0) return null;

    let fragment = document.createDocumentFragment();
    let currentText = text;

    // 简单的逐词匹配高亮逻辑（可优化）
    // 将所有单词按照长度从长到短排序可提高匹配准确率，避免嵌套匹配
    combinedWords.sort((a,b) => b.word.length - a.word.length);

    // 为了简化，这里采用逐词匹配多次替换的方式，可优化为一次性构建正则匹配
    // 演示用
    for (let {word, list} of combinedWords) {
      let flags = list.matchRules.ignoreCase ? "gi" : "g";
      let regexWord = escapeRegExp(word);
      let regex = new RegExp(`\\b${regexWord}\\b`, flags);

      currentText = currentText.replace(regex, (match) => {
        // 此处可考虑词形还原后匹配, 简化演示为直接匹配
        return `\uE000${match}\uE001`; // 用特殊标记包裹，稍后替换
      });
    }

    // 将标记的文本分裂为文本片段和标记片段
    const parts = currentText.split(/(\uE000.*?\uE001)/);

    parts.forEach(part => {
      if (part.match(/\uE000.*?\uE001/)) {
        // 这是一个高亮的部分
        let raw = part.replace(/\uE000|\uE001/g, '');
        // 找出是哪个列表匹配的
        let matchedList = findMatchingList(raw, combinedWords);
        let span = document.createElement("span");
        applyHighlightStyle(span, matchedList.highlightStyle);
        span.textContent = raw;
        fragment.appendChild(span);
      } else {
        fragment.appendChild(document.createTextNode(part));
      }
    });

    return fragment;

    function findMatchingList(word, combinedWords) {
      for (let cw of combinedWords) {
        let compare = cw.list.matchRules.ignoreCase ? word.toLowerCase() : word;
        let target = cw.list.matchRules.ignoreCase ? cw.word.toLowerCase() : cw.word;
        if (compare === target) return cw.list;
      }
      return combinedWords[0].list;
    }
  }

  function applyHighlightStyle(elem, style) {
    if (style.color) elem.style.color = style.color;
    if (style.backgroundColor) elem.style.backgroundColor = style.backgroundColor;
    if (style.fontWeight === "bold") elem.style.fontWeight = "bold";
    if (style.textDecoration === "underline") elem.style.textDecoration = "underline";
    if (style.textDecoration === "line-through") elem.style.textDecoration = "line-through";
    // 其他样式可继续添加，如波浪线等，可通过CSS class实现
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
})();
