let currentLists = [];
let selectedListIndex = null;

document.addEventListener('DOMContentLoaded', () => {
  loadLists();

  document.getElementById('add-list-btn').addEventListener('click', addNewList);
  document.getElementById('save-list-btn').addEventListener('click', saveCurrentList);
  document.getElementById('delete-list-btn').addEventListener('click', deleteCurrentList);
  document.getElementById('add-word-btn').addEventListener('click', addWordToCurrentList);
  // 导出按钮事件
  document.getElementById('export-btn').addEventListener('click', exportLists);
  // 导入按钮事件
  document.getElementById('import-btn').addEventListener('click', () => {
    // 触发隐藏的文件选择框
    document.getElementById('import-file-input').click();
  });
  // 文件选择框事件
  document.getElementById('import-file-input').addEventListener('change', handleFileImport);
});

function loadLists() {
  chrome.storage.local.get(["lists"], (res) => {
    currentLists = res.lists || [];
    renderLists();
    if (selectedListIndex === null && currentLists.length > 0) {
      selectedListIndex = 0;
      renderSelectedList();
    } else if (currentLists.length === 0) {
      selectedListIndex = null;
      clearSelectedListUI();
    }
  });
}

function renderLists() {
  const container = document.getElementById('lists-container');
  container.innerHTML = '';
  currentLists.forEach((l, idx) => {
    const div = document.createElement('div');
    div.textContent = l.name;
    div.style.padding = '5px';
    div.style.cursor = 'pointer';
    div.style.border = (idx === selectedListIndex) ? '1px solid #000' : '1px solid #ccc';
    div.addEventListener('click', () => {
      selectedListIndex = idx;
      renderSelectedList();
      renderLists();
    });
    container.appendChild(div);
  });
}

function renderSelectedList() {
  if (selectedListIndex === null) return;
  const list = currentLists[selectedListIndex];

  document.getElementById('list-name').value = list.name;
  document.getElementById('ignore-case').checked = list.matchRules.ignoreCase;
  document.getElementById('lemmatize').checked = list.matchRules.lemmatize;

  document.getElementById('color').value = list.highlightStyle.color || '#000000';
  document.getElementById('bgColor').value = list.highlightStyle.backgroundColor || '#ffff00';
  document.getElementById('bold').checked = (list.highlightStyle.fontWeight === 'bold');
  const textDecoration = list.highlightStyle.textDecoration || 'none';
  document.getElementById('underline').checked = (textDecoration === 'underline');
  document.getElementById('strikethrough').checked = (textDecoration === 'line-through');

  const wordsContainer = document.getElementById('words-container');
  wordsContainer.innerHTML = '';
  list.words.forEach((w, i) => {
    const item = document.createElement('div');
    item.textContent = w;
    item.style.marginBottom = '5px';

    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.style.marginLeft = '10px';
    delBtn.addEventListener('click', () => {
      list.words.splice(i, 1);
      renderSelectedList();
      saveLists();
    });

    item.appendChild(delBtn);
    wordsContainer.appendChild(item);
  });
}

function clearSelectedListUI() {
  document.getElementById('list-name').value = '';
  document.getElementById('ignore-case').checked = false;
  document.getElementById('lemmatize').checked = false;
  document.getElementById('color').value = '#000000';
  document.getElementById('bgColor').value = '#ffff00';
  document.getElementById('bold').checked = false;
  document.getElementById('underline').checked = false;
  document.getElementById('strikethrough').checked = false;
  document.getElementById('words-container').innerHTML = '';
  document.getElementById('new-word').value = '';
}

function addNewList() {
  const newList = {
    id: 'list_' + Date.now(),
    name: '新列表',
    words: [],
    highlightStyle: {
      color: '#000000',
      backgroundColor: '#ffff00',
      fontWeight: 'normal',
      textDecoration: 'none'
    },
    matchRules: { ignoreCase: true, lemmatize: false },
    enabled: true
  };
  currentLists.push(newList);
  selectedListIndex = currentLists.length - 1;
  saveLists();
}

function saveCurrentList() {
  if (selectedListIndex === null) return;
  const list = currentLists[selectedListIndex];
  list.name = document.getElementById('list-name').value;
  list.matchRules.ignoreCase = document.getElementById('ignore-case').checked;
  list.matchRules.lemmatize = document.getElementById('lemmatize').checked;

  const color = document.getElementById('color').value;
  const bgColor = document.getElementById('bgColor').value;
  const bold = document.getElementById('bold').checked;
  const underline = document.getElementById('underline').checked;
  const strikethrough = document.getElementById('strikethrough').checked;

  list.highlightStyle = {
    color: color,
    backgroundColor: bgColor,
    fontWeight: bold ? 'bold' : 'normal',
    textDecoration: strikethrough ? 'line-through' : underline ? 'underline' : 'none'
  };

  saveLists();
}

function deleteCurrentList() {
  if (selectedListIndex === null) return;
  currentLists.splice(selectedListIndex, 1);
  selectedListIndex = currentLists.length > 0 ? 0 : null;
  saveLists();
}

function addWordToCurrentList() {
  if (selectedListIndex === null) return;
  const wordInput = document.getElementById('new-word');
  const newWord = wordInput.value.trim();
  if (newWord) {
    currentLists[selectedListIndex].words.push(newWord);
    wordInput.value = '';
    renderSelectedList();
    saveLists();
  }
}

function saveLists() {
  chrome.runtime.sendMessage({ type: "setLists", lists: currentLists }, (res) => {
    loadLists();
  });
}

function exportLists() {
  chrome.storage.local.get(["lists"], (res) => {
    const data = { 
      version: "1.0", 
      lists: res.lists || [] 
    };
    const jsonStr = JSON.stringify(data, null, 2);
    
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `word_lists_${new Date().toISOString().slice(0,10)}.json`; 
    a.click();
    
    URL.revokeObjectURL(url);
  });
}

function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return; // 用户取消选择
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      const parsed = JSON.parse(content);

      // 检查版本字段
      if (!parsed.version) {
        console.warn("导入数据无版本号，将按兼容模式处理");
      }

      if (Array.isArray(parsed.lists)) {
        // 显示导入预览信息并让用户确认
        previewImport(parsed.lists);
      } else {
        showImportStatus("导入的 JSON 文件格式不正确：缺少 lists 数组", true);
      }
    } catch (err) {
      showImportStatus("JSON 解析失败：" + err.message, true);
    }
  };
  
  reader.readAsText(file);
}

function previewImport(importLists) {
  // 从本地获取当前列表
  chrome.storage.local.get(["lists"], (res) => {
    const currentLists = res.lists || [];
    const { newListsCount, newWordsCount } = calculateDifferences(currentLists, importLists);

    // 显示摘要信息
    const msg = `即将导入数据：\n` +
                `新增列表数: ${newListsCount}\n` +
                `新增单词数: ${newWordsCount}\n` +
                `是否确认继续导入？`;
    const confirmed = confirm(msg);
    if (confirmed) {
      importListsData(currentLists, importLists);
    } else {
      showImportStatus("已取消导入", false);
    }
  });
}

function calculateDifferences(currentLists, importLists) {
  let newListsCount = 0;
  let newWordsCount = 0;

  // 将当前列表索引化，方便查找
  const currentListsById = {};
  currentLists.forEach(l => { currentListsById[l.id] = l; });

  importLists.forEach(importList => {
    const existingList = currentListsById[importList.id];
    if (!existingList) {
      // 全新列表的所有单词都算新增
      newListsCount++;
      newWordsCount += importList.words ? importList.words.length : 0;
    } else {
      // 合并模式：查找不重复的新单词数
      const currentWordsSet = new Set(existingList.words.map(w => w.word));
      const importedWords = importList.words || [];
      importedWords.forEach(w => {
        if (!currentWordsSet.has(w.word)) {
          // 这是新单词
          newWordsCount++;
        }
      });
    }
  });

  return { newListsCount, newWordsCount };
}

function importListsData(currentLists, importLists) {
  // 在这里执行合并策略：
  // 1. 将导入列表与本地列表按 id 匹配
  // 2. 如果本地不存在该列表，直接添加
  // 3. 如果存在则合并单词，对重复单词进行去重
  
  const currentListsById = {};
  currentLists.forEach(l => { currentListsById[l.id] = l; });

  importLists.forEach(importList => {
    const existingList = currentListsById[importList.id];
    if (!existingList) {
      // 新列表，直接添加
      currentLists.push(importList);
      currentListsById[importList.id] = importList;
    } else {
      // 合并单词
      const currentWordsMap = new Map(existingList.words.map(w => [w.word, w]));
      (importList.words || []).forEach(w => {
        if (!currentWordsMap.has(w.word)) {
          // 添加新单词
          existingList.words.push(w);
          currentWordsMap.set(w.word, w);
        } else {
          // 已存在该单词，可根据需要合并字段 
          // 此处简化为不覆盖旧字段。可扩展为合并注释、翻译等。
        }
      });

      // 可考虑合并 matchRules 或 highlightStyle，如不需要则保持本地配置
      // existingList.matchRules = { ...existingList.matchRules, ...importList.matchRules } 等逻辑
    }
  });

  // 存储合并后的数据
  applyImportData(currentLists);
}

function applyImportData(newListsData) {
  chrome.storage.local.set({ lists: newListsData }, () => {
    showImportStatus("列表已成功导入并合并", false);
    // 导入后重新加载列表数据刷新UI
    loadLists();
    // 通知 content script 更新
    chrome.runtime.sendMessage({type: "setLists", lists: newListsData}, (res) => {
      if (!res.success) {
        console.warn("导入后通知更新失败");
      }
    });
  });
}

function showImportStatus(msg, isError) {
  const statusDiv = document.getElementById('import-status');
  statusDiv.textContent = msg;
  statusDiv.style.color = isError ? '#cc0000' : '#008000';
}
