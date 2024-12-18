// background/background.js
import { initializeListsIfEmpty } from './storage.js';
import { setupMessageListeners } from './events.js';
import { rebuildContextMenus, setupContextMenuClickListener } from './menus.js';
import { getStorageArea } from './storage.js';

chrome.runtime.onInstalled.addListener(() => {
    initializeListsIfEmpty();
    rebuildContextMenus();
});

setupMessageListeners();
setupContextMenuClickListener(getStorageArea);
