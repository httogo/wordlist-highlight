chrome.runtime.onInstalled.addListener(() => {
  // 初始化本地存储的列表数据（如果不存在）
  chrome.storage.local.get(["lists"], (res) => {
    if (!res.lists) {
      chrome.storage.local.set({ lists: [] });
    }
  });

  // 创建右键菜单
  chrome.contextMenus.create({
    id: "addToList",
    title: "添加选中单词到列表",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToList" && info.selectionText) {
    // 将选中的单词添加到列表的逻辑
    // 实际需求可能需要用户选择要添加的列表，这里进行简化：
    // 弹出页面管理中可设置默认列表，或在 popup 中让用户选择一个 "默认列表"。
    // 若无默认列表，这里简单地添加到第一个列表。
    const selectedWord = info.selectionText.trim();
    chrome.storage.local.get(["lists"], (res) => {
      let lists = res.lists || [];
      if (lists.length > 0) {
        lists[0].words.push(selectedWord);
        chrome.storage.local.set({ lists }, () => {
          console.log(`已将 "${selectedWord}" 添加到列表 "${lists[0].name}"`);
          // 通知前台可以考虑重新刷新高亮，但一般在下次页面刷新才生效
        });
      } else {
        console.log("没有可用的列表来添加单词。");
      }
    });
  }
});

// 处理消息传递
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getLists") {
    chrome.storage.local.get(["lists"], (res) => {
      sendResponse({ lists: res.lists || [] });
    });
    return true; // 异步响应
  } else if (message.type === "setLists") {
    chrome.storage.local.set({ lists: message.lists }, () => {
      sendResponse({ success: true });
    });
    return true; // 异步响应
  }
});
