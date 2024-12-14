let currentLists = [];
let selectedListIndex = null;

document.addEventListener('DOMContentLoaded', () => {
  loadLists();

  document.getElementById('add-list-btn').addEventListener('click', addNewList);
  document.getElementById('save-list-btn').addEventListener('click', saveCurrentList);
  document.getElementById('delete-list-btn').addEventListener('click', deleteCurrentList);
  document.getElementById('add-word-btn').addEventListener('click', addWordToCurrentList);
});

function loadLists() {
  chrome.storage.local.get(["lists"], (res) => {
    currentLists = res.lists || [];
    renderLists();
    if (selectedListIndex === null && currentLists.length > 0) {
      selectedListIndex = 0;
      renderSelectedList();
    }
  });
}

function renderLists() {
  const container = document.getElementById('lists-container');
  container.innerHTML = '';
  currentLists.forEach((l, idx) => {
    const div = document.createElement('div');
    div.textContent = l.name;
    div.className = 'list-item';
    div.addEventListener('click', () => {
      selectedListIndex = idx;
      renderSelectedList();
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
  document.getElementById('bgColor').value = list.highlightStyle.backgroundColor || '#ffffff';
  document.getElementById('bold').checked = list.highlightStyle.fontWeight === 'bold';
  document.getElementById('underline').checked = list.highlightStyle.textDecoration === 'underline';
  document.getElementById('strikethrough').checked = list.highlightStyle.textDecoration === 'line-through';

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
    });

    item.appendChild(delBtn);
    wordsContainer.appendChild(item);
  });
}

function addNewList() {
  const newList = {
    id: 'list_' + Date.now(),
    name: '新列表',
    words: [],
    highlightStyle: {},
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
  chrome.storage.local.set({lists: currentLists}, () => {
    renderLists();
    renderSelectedList();
  });
}
