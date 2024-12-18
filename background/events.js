// background/events.js
import { getLists, setLists } from './storage.js';
import { notifyAllTabsListsUpdated, rebuildContextMenus } from './menus.js';

export function setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "getLists") {
            getLists((lists) => sendResponse({ lists }));
            return true;
        } else if (message.type === "setLists") {
            setLists(message.lists, () => {
                notifyAllTabsListsUpdated();
                rebuildContextMenus();
                sendResponse({ success: true });
            });
            return true;
        }
    });
}
