// background.js

// 当扩展安装或更新时执行一次初始化
chrome.runtime.onInstalled.addListener(() => {
    initializeListsIfEmpty();
    rebuildContextMenus();
});

// 当接收到更新列表请求时或在其他需要时，可调用该函数重建右键菜单
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "getLists") {
        chrome.storage.local.get(["lists"], (res) => {
            sendResponse({ lists: res.lists || [] });
        });
        return true;
    } else if (message.type === "setLists") {
        chrome.storage.local.set({ lists: message.lists }, () => {
            // 列表更新完成后，通知所有 tab 的 content script 进行更新
            notifyAllTabsListsUpdated();
            // 列表更新后重新构建右键菜单
            rebuildContextMenus();
            sendResponse({ success: true });
        });
        return true;
    }
});


// 初始化列表为空
function initializeListsIfEmpty() {
    chrome.storage.local.get(["lists"], (res) => {
        if (!res.lists) {
            chrome.storage.local.set({ lists: [] });
        }
    });
}

// 重建右键菜单：
// 1. 清空已有菜单
// 2. 创建父菜单 "添加选中单词到列表"
// 3. 从 storage 中读取列表，为每个列表添加一个子菜单项
function rebuildContextMenus() {
    // 首先移除所有已存在的菜单项
    chrome.contextMenus.removeAll(() => {
        // 获取列表数据
        chrome.storage.local.get(["lists"], (res) => {
            const lists = res.lists || [];
            if (lists.length > 0) {
                // 创建父菜单项
                chrome.contextMenus.create({
                    id: "addToSpecificList",
                    title: "添加选中单词到列表",
                    contexts: ["selection"]
                });

                // 为每个列表创建子菜单项
                lists.forEach((list) => {
                    chrome.contextMenus.create({
                        id: `addToList_${list.id}`,
                        title: list.name,
                        contexts: ["selection"],
                        parentId: "addToSpecificList"
                    });
                });
            } else {
                // 如果没有列表，则不创建父子菜单结构或者
                // 可创建一个灰色菜单提示用户无列表。
                chrome.contextMenus.create({
                    id: "noListAvailable",
                    title: "暂无列表，请在选项中创建",
                    contexts: ["selection"],
                    enabled: false
                });
            }
        });
    });
}

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const { menuItemId, selectionText } = info;
    if (!selectionText || !selectionText.trim()) return;

    if (menuItemId.startsWith("addToList_")) {
        // 子菜单项的ID格式为：addToList_listID
        const listId = menuItemId.replace("addToList_", "");
        const selectedWord = selectionText.trim();

        chrome.storage.local.get(["lists"], (res) => {
            let lists = res.lists || [];
            const targetList = lists.find(l => l.id === listId);
            if (targetList) {
                targetList.words.push(selectedWord);
                chrome.storage.local.set({ lists }, () => {
                    console.log(`已将 "${selectedWord}" 添加到列表 "${targetList.name}"`);
                    // 在此处通知所有 tab 更新高亮
                    notifyAllTabsListsUpdated();
                });
            } else {
                console.log("未找到指定的列表，可能已被删除。");
            }
        });
    }
});

// 通知所有 tab 列表已更新，让 content script 刷新高亮
function notifyAllTabsListsUpdated() {
  chrome.tabs.query({}, (tabs) => {
    for (let t of tabs) {
      chrome.tabs.sendMessage(t.id, { type: "listsUpdated" });
    }
  });
}
