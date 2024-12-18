// popup/popup.js
document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ type: "getLists" }, (response) => {
        const lists = response.lists || [];
        const listsContainer = document.getElementById('lists');
        listsContainer.innerHTML = '';
        lists.forEach((l, idx) => {
            const div = document.createElement('div');
            div.className = 'list-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = l.enabled;
            checkbox.title = `启用/禁用 ${l.name}`;
            checkbox.addEventListener('change', () => {
                l.enabled = checkbox.checked;
                saveLists(lists);
            });

            const span = document.createElement('span');
            span.className = 'list-name';
            span.textContent = l.name;

            div.appendChild(checkbox);
            div.appendChild(span);
            listsContainer.appendChild(div);
        });
    });

    function saveLists(lists) {
        chrome.runtime.sendMessage({ type: "setLists", lists }, (res) => {
            console.log("Lists saved.");
        });
    }
});
