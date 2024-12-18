// background/storage.js
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
        if (!res.lists) {
            chrome.storage.local.set({ lists: [] });
        }
    });
}
