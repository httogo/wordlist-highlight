chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["lists"], (res) => {
    if (!res.lists) {
      const initialLists = [];
      chrome.storage.local.set({lists: initialLists});
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
    // 将选中文字添加到指定列表的逻辑
    // 实际应弹出一个二级菜单或通过popup选择列表，这里简化为添加到默认列表
    // 可通过发送消息给popup或者直接在此管理选项。
    // 为演示，这里假设有个默认列表id "defaultList"
    const selectedWord = info.selectionText.trim();
    chrome.storage.local.get(["lists"], (res) => {
      let lists = res.lists || [];
      // 简化逻辑：将选词添加到第一个列表中
      if (lists.length > 0) {
        lists[0].words.push(selectedWord);
        chrome.storage.local.set({lists}, () => {
          console.log(`已将 ${selectedWord} 添加到列表 ${lists[0].name}`);
          // 通知content script下次刷新页面时重新高亮
        });
      } else {
        console.log("没有可添加的列表。");
      }
    });
  }
});

// 接收来自popup或options的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getLists") {
    chrome.storage.local.get(["lists"], (res) => {
      sendResponse({lists: res.lists || []});
    });
    return true;
  } else if (message.type === "setLists") {
    chrome.storage.local.set({lists: message.lists}, () => {
      sendResponse({success: true});
    });
    return true;
  }
});
