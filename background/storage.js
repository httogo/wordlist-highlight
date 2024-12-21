// background/storage.js
import { defaultLists } from './defaultLists.js';

export function getStorageArea(callback) {
    chrome.storage.local.get(["useSyncStorage"], (res) => {
        const useSync = res.useSyncStorage === true;
        callback(useSync ? chrome.storage.sync : chrome.storage.local);
    });
}

export function getLists(callback) {
    getStorageArea((storage) => {
        storage.get(["lists"], (res) => {
            callback(res.lists || []);
        });
    });
}

export function setLists(lists, callback) {
    getStorageArea((storage) => {
        storage.set({ lists }, () => {
            callback && callback();
        });
    });
}

export function initializeListsIfEmpty() {
    chrome.storage.local.get(["lists"], (res) => {
        if (!res.lists || res.lists.length === 0) {
            chrome.storage.local.set({ lists: defaultLists }, () => {
                console.log("默认词表已初始化。");
            });
        }
    });
}
