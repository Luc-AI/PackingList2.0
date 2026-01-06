document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let items = JSON.parse(localStorage.getItem('packlist_items')) || [];
    let theme = localStorage.getItem('packlist_theme') || 'light';
    const ID_PREFIX = 'id_' + Date.now() + '_';

    // --- DOM Elements ---
    const itemList = document.getElementById('item-list');
    const form = document.getElementById('add-item-form');
    const input = document.getElementById('new-item-input');
    const resetBtn = document.getElementById('reset-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // --- Icons ---
    const MOON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    const SUN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const TRASH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

    const HANDLE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drag-icon"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>`;

    // --- Init ---
    applyTheme();
    renderList();

    // --- Drag & Drop ---
    if (typeof Sortable !== 'undefined') {
        Sortable.create(itemList, {
            animation: 150,
            handle: '.drag-handle', // Only drag when pulling the icon
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                // Reorder items array based on new DOM order
                const movedItem = items.splice(evt.oldIndex, 1)[0];
                items.splice(evt.newIndex, 0, movedItem);
                saveItems();
            },
        });
    } else {
        console.warn("SortableJS not loaded. Drag & Drop disabled.");
    }

    // --- Event Listeners ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addItem();
    });

    // Event Delegation for List Items
    itemList.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.item');
        if (!itemEl) return;
        const id = itemEl.dataset.id;

        // Checkbox Click
        if (e.target.closest('.checkbox')) {
            toggleItem(id);
        }
        // Delete Button Click
        else if (e.target.closest('.delete-btn')) {
            deleteItem(id);
        }
    });

    itemList.addEventListener('input', (e) => {
        // Edit Text
        if (e.target.classList.contains('item-text')) {
            const id = e.target.closest('.item').dataset.id;
            updateItemText(id, e.target.innerText);
        }
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Uncheck all items?')) {
            items.forEach(item => item.checked = false);
            saveItems();
            renderList();
        }
    });

    themeToggle.addEventListener('click', () => {
        theme = theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('packlist_theme', theme);
        applyTheme();
    });

    // --- Functions ---

    function addItem() {
        const text = input.value.trim();
        if (!text) return;

        const newItem = {
            id: ID_PREFIX + Math.random().toString(36).substr(2, 9),
            text: text,
            checked: false
        };

        items.push(newItem);
        saveItems();

        // Optimistic UI Update (append only to avoid full re-render scroll jump)
        itemList.appendChild(createItemElement(newItem));
        input.value = '';
        input.focus();

        // Scroll to bottom
        itemList.scrollTo({ top: itemList.scrollHeight, behavior: 'smooth' });
    }

    function toggleItem(id) {
        const item = items.find(i => i.id === id);
        if (item) {
            item.checked = !item.checked;
            saveItems();
            // Partial Update
            const el = document.querySelector(`.item[data-id="${id}"]`);
            if (el) {
                el.classList.toggle('checked');
            }
        }
    }

    function deleteItem(id) {
        items = items.filter(i => i.id !== id);
        saveItems();
        const el = document.querySelector(`.item[data-id="${id}"]`);
        if (el) el.remove();
    }

    function updateItemText(id, newText) {
        const item = items.find(i => i.id === id);
        if (item) {
            item.text = newText;
            // Debounced save could be better, but instant is fine for local
            saveItems();
        }
    }

    function saveItems() {
        localStorage.setItem('packlist_items', JSON.stringify(items));
        updateProgress();
    }

    function updateProgress() {
        const total = items.length;
        const checked = items.filter(i => i.checked).length;
        const percent = total === 0 ? 0 : Math.round((checked / total) * 100);

        document.getElementById('progress-percent').innerText = `${percent}% Packed`;
        document.getElementById('progress-count').innerText = `${checked}/${total} items`;
        document.getElementById('progress-fill').style.width = `${percent}%`;
    }

    // Init Progress call
    updateProgress();

    function applyTheme() {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.innerHTML = SUN_ICON;
        } else {
            body.classList.remove('dark-mode');
            themeToggle.innerHTML = MOON_ICON;
        }
    }

    function createItemElement(item) {
        const li = document.createElement('li');
        li.className = `item ${item.checked ? 'checked' : ''}`;
        li.dataset.id = item.id;

        li.innerHTML = `
            <div class="drag-handle" aria-label="Drag to reorder">${HANDLE_ICON}</div>
            <div class="checkbox"></div>
            <div class="item-text" contenteditable="true" spellcheck="false">${escapeHtml(item.text)}</div>
            <button class="delete-btn" aria-label="Delete">
                ${TRASH_ICON}
            </button>
        `;
        return li;
    }

    function renderList() {
        itemList.innerHTML = '';
        const frag = document.createDocumentFragment();
        items.forEach(item => {
            frag.appendChild(createItemElement(item));
        });
        itemList.appendChild(frag);
        updateProgress();
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
