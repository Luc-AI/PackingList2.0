import { HANDLE_ICON, TRASH_ICON } from './icons.js';

export function createItemElement(item) {
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

export function createGhostElement() {
    // Create an item but with 'ghost' class
    const li = createItemElement({ id: 'ghost', text: '', checked: false });
    li.classList.add('ghost');
    li.removeAttribute('data-id'); // Allow it to be just a ghost
    return li;
}

export function renderList(itemList, items, updateProgressCallback) {
    itemList.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach(item => {
        frag.appendChild(createItemElement(item));
    });
    itemList.appendChild(frag);

    // Append initial ghost
    itemList.appendChild(createGhostElement());

    if (updateProgressCallback) updateProgressCallback();
}

export function updateProgress(items) {
    const total = items.length;
    const checked = items.filter(i => i.checked).length;
    const percent = total === 0 ? 0 : Math.round((checked / total) * 100);

    const percentEl = document.getElementById('progress-percent');
    const countEl = document.getElementById('progress-count');
    const fillEl = document.getElementById('progress-fill');

    if (percentEl) percentEl.innerText = `${percent}% Packed`;
    if (countEl) countEl.innerText = `${checked}/${total} items`;
    if (fillEl) fillEl.style.width = `${percent}%`;
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
