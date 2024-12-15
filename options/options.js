let currentLists = [];
let selectedListIndex = null;
let useSyncStorage = false; // 新增变量记录用户偏好

document.addEventListener('DOMContentLoaded', () => {
  // 读取useSyncStorage状态
  chrome.storage.local.get(["useSyncStorage"], (res) => {
    useSyncStorage = (res.useSyncStorage === true);
    document.getElementById('use-sync-storage').checked = useSyncStorage;
    // 加载列表
    loadLists();
  });

  document.getElementById('use-sync-storage').addEventListener('change', onUseSyncStorageChange);

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

  // 云同步开关事件
  document.getElementById('use-sync-storage').addEventListener('change', (e) => {
    useSyncStorage = e.target.checked;
    chrome.storage.local.set({ useSyncStorage }, () => {
      // 状态更新后重新加载列表，以从对应存储读取数据
      loadLists();
    });
  });
});

function loadLists() {
  // 根据useSyncStorage发送消息getLists
  chrome.runtime.sendMessage({ type: "getLists" }, (response) => {
    currentLists = response.lists || [];
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
    if (res && res.success) {
      loadLists();
    }
  });
}

function exportLists() {
  // 获取扩展版本号
  const manifest = chrome.runtime.getManifest();
  const extensionVersion = manifest.version; // 例如 "1.0.3"

  chrome.runtime.sendMessage({ type: "getLists" }, (response) => {
    const data = { 
      version: extensionVersion,  // 使用扩展版本号作为文件版本号
      lists: response.lists || []
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
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      const parsed = JSON.parse(content);

      if (!parsed.version) {
        // 如果文件中没有 version 字段，可以记录日志或给出警告
        console.warn("导入文件无版本号，将使用兼容模式处理");
      } else {
        // 获取扩展版本
        const manifest = chrome.runtime.getManifest();
        const extensionVersion = manifest.version;
        console.log(`导入文件版本号: ${parsed.version}, 当前扩展版本号: ${extensionVersion}`);
        // 如果需要根据版本号进行特殊处理（如兼容旧结构），可在此判断版本差异
      }

      if (Array.isArray(parsed.lists)) {
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
  // 先获取当前列表
  chrome.runtime.sendMessage({ type: "getLists" }, (response) => {
    const currentLists = response.lists || [];
    const { newListsCount, newWordsCount } = calculateDifferences(currentLists, importLists);

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

  const currentListsById = {};
  currentLists.forEach(l => { currentListsById[l.id] = l; });

  importLists.forEach(importList => {
    const existingList = currentListsById[importList.id];
    if (!existingList) {
      newListsCount++;
      newWordsCount += importList.words ? importList.words.length : 0;
    } else {
      const currentWordsSet = new Set(existingList.words.map(w => w.word));
      const importedWords = importList.words || [];
      importedWords.forEach(w => {
        if (!currentWordsSet.has(w.word)) {
          newWordsCount++;
        }
      });
    }
  });

  return { newListsCount, newWordsCount };
}

function importListsData(currentLists, importLists) {
  const currentListsById = {};
  currentLists.forEach(l => { currentListsById[l.id] = l; });

  importLists.forEach(importList => {
    const existingList = currentListsById[importList.id];
    if (!existingList) {
      currentLists.push(importList);
      currentListsById[importList.id] = importList;
    } else {
      const currentWordsMap = new Map(existingList.words.map(w => [w.word, w]));
      (importList.words || []).forEach(w => {
        if (!currentWordsMap.has(w.word)) {
          existingList.words.push(w);
          currentWordsMap.set(w.word, w);
        }
      });
    }
  });

  applyImportData(currentLists);
}

function applyImportData(newListsData) {
  chrome.runtime.sendMessage({ type: "setLists", lists: newListsData }, (res) => {
    if (res && res.success) {
      showImportStatus("列表已成功导入并合并", false);
      loadLists();
    }
  });
}

function showImportStatus(msg, isError) {
  const statusDiv = document.getElementById('import-status');
  statusDiv.textContent = msg;
  statusDiv.style.color = isError ? '#cc0000' : '#008000';
}

function onUseSyncStorageChange(e) {
  const newMode = e.target.checked; // true表示云同步，false表示本地
  if (newMode === useSyncStorage) return; // 没有实际改变

  if (newMode === true) {
    // 从本地切换到云：合并本地和云数据
    Promise.all([
      getLocalLists(),
      getSyncLists()
    ]).then(([localLists, syncLists]) => {
      const merged = mergeListsData(localLists, syncLists);
      chrome.storage.sync.set({ lists: merged }, () => {
        chrome.storage.local.set({ useSyncStorage: true }, () => {
          useSyncStorage = true;
          loadLists(); // 此时将从sync获取数据
        });
      });
    });
  } else {
    // 从云切换到本地：合并云和本地数据
    Promise.all([
      getSyncLists(),
      getLocalLists()
    ]).then(([syncLists, localLists]) => {
      const merged = mergeListsData(localLists, syncLists);
      chrome.storage.local.set({ lists: merged }, () => {
        chrome.storage.local.set({ useSyncStorage: false }, () => {
          useSyncStorage = false;
          loadLists(); // 此时从local获取数据
        });
      });
    });
  }
}

// 获取本地lists
function getLocalLists() {
  return new Promise(resolve => {
    chrome.storage.local.get(["lists"], (res) => {
      resolve(res.lists || []);
    });
  });
}

// 获取云端lists
function getSyncLists() {
  return new Promise(resolve => {
    chrome.storage.sync.get(["lists"], (res) => {
      resolve(res.lists || []);
    });
  });
}

// 合并两个列表数组的数据，不重复添加同一单词
function mergeListsData(listsA, listsB) {
  // 使用map存储列表，根据id索引
  const map = new Map();
  // 先将listsA的所有列表放入map
  for (const l of listsA) {
    map.set(l.id, {
      ...l,
      words: l.words ? [...l.words] : []
    });
  }

  // 再遍历listsB，合并到map中
  for (const l of listsB) {
    if (!map.has(l.id)) {
      // 全新列表直接添加
      map.set(l.id, {
        ...l,
        words: l.words ? [...l.words] : []
      });
    } else {
      // 合并同id列表
      const existing = map.get(l.id);
      const existingWordsMap = new Map(existing.words.map(w => [w.word, w]));

      // 合并新列表的words
      for (const w of (l.words || [])) {
        if (!existingWordsMap.has(w.word)) {
          existing.words.push(w);
          existingWordsMap.set(w.word, w);
        }
        // 如果存在相同word，可在此实现字段合并逻辑（如notes合并）
        // 示例中略过此步
      }

      // 可选择合并matchRules、highlightStyle等字段，以后需要可补充
      // 如果需以B的规则覆盖A的则:
      // existing.matchRules = { ...existing.matchRules, ...l.matchRules };
      // existing.highlightStyle = { ...existing.highlightStyle, ...l.highlightStyle };

      map.set(l.id, existing);
    }
  }

  return Array.from(map.values());
}