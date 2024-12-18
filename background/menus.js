// background/menus.js
import { getStorageArea } from './storage.js';

export function rebuildContextMenus() {
    chrome.contextMenus.removeAll(() => {
        getStorageArea((storage) => {
            storage.get(["lists"], (res) => {
                const lists = res.lists || [];
                if (lists.length > 0) {
                    chrome.contextMenus.create({
                        id: "addToSpecificList",
                        title: "添加选中单词到列表",
                        contexts: ["selection"]
                    });

                    lists.forEach((list) => {
                        chrome.contextMenus.create({
                            id: `addToList_${list.id}`,
                            title: list.name,
                            contexts: ["selection"],
                            parentId: "addToSpecificList"
                        });
                    });
                } else {
                    chrome.contextMenus.create({
                        id: "noListAvailable",
                        title: "暂无列表，请在选项中创建",
                        contexts: ["selection"],
                        enabled: false
                    });
                }
            });
        });
    });
}

export function notifyAllTabsListsUpdated() {
    chrome.tabs.query({}, (tabs) => {
        for (let t of tabs) {
            chrome.tabs.sendMessage(t.id, { type: "listsUpdated" }, () => {
                if (chrome.runtime.lastError) {
                    console.warn("无法向此标签页发送消息：", chrome.runtime.lastError.message);
                    // 此错误可忽略，不影响整体逻辑
                }
            });
        }
    });
}

export function setupContextMenuClickListener(getStorageArea) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        const { menuItemId, selectionText } = info;
        if (!selectionText || !selectionText.trim()) return;

        if (menuItemId.startsWith("addToList_")) {
            const listId = menuItemId.replace("addToList_", "");
            const selectedWord = selectionText.trim();

            getStorageArea((storage) => {
                storage.get(["lists"], (res) => {
                    let lists = res.lists || [];
                    const targetList = lists.find(l => l.id === listId);
                    if (targetList) {
                        targetList.words.push(selectedWord);
                        storage.set({ lists }, () => {
                            console.log(`已将 "${selectedWord}" 添加到列表 "${targetList.name}"`);
                            notifyAllTabsListsUpdated();
                        });
                    } else {
                        console.log("未找到指定的列表，可能已被删除。");
                    }
                });
            });
        }
    });
}
