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
            let lists = res.lists || [];
            lists.forEach(list => {
                // 如果 words 里有字符串或其他格式的东西，这里统一做一下处理
                list.words = (list.words || []).map((item) => {
                    if (typeof item === 'string') {
                        return { word: item, comment: '' };
                    } else if (item && typeof item.word === 'string') {
                        return { word: item.word, comment: item.comment || '' };
                    } else {
                        // 如果完全不合规，就过滤或做其它处理
                        return null;
                    }
                }).filter(Boolean);
            });
            callback(lists);
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
