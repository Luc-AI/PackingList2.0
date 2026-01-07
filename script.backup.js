document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let items = JSON.parse(localStorage.getItem('packlist_items')) || [];
    let theme = localStorage.getItem('packlist_theme') || 'light';
    const ID_PREFIX = 'id_' + Date.now() + '_';

    // --- DOM Elements ---
    const itemList = document.getElementById('item-list');
    // Removed legacy form elements
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
            handle: '.drag-handle',
            filter: '.ghost', // Prevent dragging ghost
            ghostClass: 'sortable-ghost',
            onMove: function (evt) {
                // Prevent dropping items below the ghost item
                return !evt.related.classList.contains('ghost');
            },
            onEnd: function (evt) {
                // Reorder items array
                // Since ghost is always last and we can't drop below it, the indices map correctly to items array
                const movedItem = items.splice(evt.oldIndex, 1)[0];
                items.splice(evt.newIndex, 0, movedItem);
                saveItems();
            },
        });
    } else {
        console.warn("SortableJS not loaded.");
    }

    // --- Event Listeners ---

    // Event Delegation for List
    itemList.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.item');
        if (!itemEl || itemEl.classList.contains('ghost')) return; // Ignore clicks on ghost controls if any

        const id = itemEl.dataset.id;

        // Checkbox
        if (e.target.closest('.checkbox')) {
            toggleItem(id);
        }
        // Delete
        else if (e.target.closest('.delete-btn')) {
            deleteItem(id);
        }
    });

    // Content Edits (Input)
    itemList.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-text')) {
            const itemEl = e.target.closest('.item');
            if (!itemEl.classList.contains('ghost')) {
                const id = itemEl.dataset.id;
                updateItemText(id, e.target.innerText);
            }
        }
    });

    // Keydown (Enter) - Commit Ghost or Blur
    itemList.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('item-text')) {
            e.preventDefault(); // Prevent newline
            const itemEl = e.target.closest('.item');
            if (itemEl.classList.contains('ghost')) {
                commitGhost(itemEl, true); // true = focus new
            } else {
                e.target.blur();
            }
        }
    });

    // Focusout (Auto-save Ghost)
    itemList.addEventListener('focusout', (e) => {
        if (e.target.classList.contains('item-text')) {
            const itemEl = e.target.closest('.item');
            if (itemEl && itemEl.classList.contains('ghost')) {
                // If text exists, save it
                if (e.target.innerText.trim()) {
                    commitGhost(itemEl, false); // false = don't focus new
                } else {
                    // Start fresh if empty (cleans up any weird whitespace)
                    e.target.innerText = '';
                }
            }
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

    function commitGhost(ghostEl, shouldFocus) {
        const text = ghostEl.querySelector('.item-text').innerText.trim();
        if (!text) return;

        const newItem = {
            id: ID_PREFIX + Math.random().toString(36).substr(2, 9),
            text: text,
            checked: false
        };

        items.push(newItem);
        saveItems();

        // Convert Ghost to Real Item in DOM (Optimistic)
        ghostEl.classList.remove('ghost');
        ghostEl.dataset.id = newItem.id;
        // The HTML structure is already there, CSS reveals handles/delete buttons

        // Append new Ghost
        const newGhost = createGhostElement();
        itemList.appendChild(newGhost);

        if (shouldFocus) {
            // Need small timeout for DOM to settle/scroll
            requestAnimationFrame(() => {
                const textEl = newGhost.querySelector('.item-text');
                textEl.focus();
                // Ensure visible
                newGhost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }

        // If not focusing new (blur), we just leave everything as is. 
        // The user clicked somewhere else, so focus is already going there.
    }

    function toggleItem(id) {
        const item = items.find(i => i.id === id);
        if (item) {
            item.checked = !item.checked;
            saveItems();
            const el = document.querySelector(`.item[data-id="${id}"]`);
            if (el) el.classList.toggle('checked');
        }
    }

    function deleteItem(id) {
        if (confirm('Delete this item?')) {
            items = items.filter(i => i.id !== id);
            saveItems();
            const el = document.querySelector(`.item[data-id="${id}"]`);
            if (el) el.remove();
        }
    }

    function updateItemText(id, newText) {
        const item = items.find(i => i.id === id);
        if (item) {
            item.text = newText;
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

    function createGhostElement() {
        // Create an item but with 'ghost' class
        const li = createItemElement({ id: 'ghost', text: '', checked: false });
        li.classList.add('ghost');
        li.removeAttribute('data-id'); // Allow it to be just a ghost
        return li;
    }

    function renderList() {
        itemList.innerHTML = '';
        const frag = document.createDocumentFragment();
        items.forEach(item => {
            frag.appendChild(createItemElement(item));
        });
        itemList.appendChild(frag);

        // Append initial ghost
        itemList.appendChild(createGhostElement());

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
