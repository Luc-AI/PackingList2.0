import './style.css';
import { getItems, saveItems } from './storage.js';
import { initTheme } from './theme.js';
import { createItemElement, createGhostElement, renderList, updateProgress } from './ui.js';
import { initDragAndDrop } from './drag-drop.js';

// --- State ---
let items = getItems();
const ID_PREFIX = 'id_' + Date.now() + '_';

// --- DOM Elements ---
const itemList = document.getElementById('item-list');
const resetBtn = document.getElementById('reset-btn');

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderList(itemList, items, () => updateProgress(items));

    // Init Sortable
    initDragAndDrop(itemList, items, (newItems) => {
        items = newItems; // Update local ref if needed (though array ref usually same if mutated, splice mutates)
        saveItems(items);
    });

    // --- Event Listeners ---

    // Event Delegation for List
    itemList.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.item');
        if (!itemEl || itemEl.classList.contains('ghost')) return; // Ignore clicks on ghost controls if any

        const id = itemEl.dataset.id;
        const item = items.find(i => i.id === id);

        // Checkbox
        if (e.target.closest('.checkbox')) {
            if (item) {
                item.checked = !item.checked;
                saveItems(items);
                itemEl.classList.toggle('checked');
                updateProgress(items);
            }
        }
        // Delete
        else if (e.target.closest('.delete-btn')) {
            if (confirm('Delete this item?')) {
                // Update module scope items
                items = items.filter(i => i.id !== id);
                saveItems(items);
                itemEl.remove();
                updateProgress(items);
            }
        }
    });

    // Content Edits (Input)
    itemList.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-text')) {
            const itemEl = e.target.closest('.item');
            if (itemEl && !itemEl.classList.contains('ghost')) {
                const id = itemEl.dataset.id;
                const item = items.find(i => i.id === id);
                if (item) {
                    item.text = e.target.innerText;
                    saveItems(items);
                }
            }
        }
    });

    // Keydown (Enter) - Commit Ghost or Blur
    itemList.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('item-text')) {
            e.preventDefault(); // Prevent newline
            const itemEl = e.target.closest('.item');
            if (itemEl && itemEl.classList.contains('ghost')) {
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

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Uncheck all items?')) {
                items.forEach(item => item.checked = false);
                saveItems(items);
                renderList(itemList, items, () => updateProgress(items));
            }
        });
    }
});

function commitGhost(ghostEl, shouldFocus) {
    const text = ghostEl.querySelector('.item-text').innerText.trim();
    if (!text) return;

    // Use randomUUID if available, else fallback
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (ID_PREFIX + Math.random().toString(36).substr(2, 9));

    const newItem = {
        id: uniqueId,
        text: text,
        checked: false
    };

    items.push(newItem);
    saveItems(items);
    updateProgress(items);

    // Convert Ghost to Real Item in DOM (Optimistic)
    ghostEl.classList.remove('ghost');
    ghostEl.dataset.id = newItem.id;

    // Append new Ghost
    const newGhost = createGhostElement();
    itemList.appendChild(newGhost);

    if (shouldFocus) {
        // Need small timeout for DOM to settle/scroll
        requestAnimationFrame(() => {
            const textEl = newGhost.querySelector('.item-text');
            if (textEl) textEl.focus();
            // Ensure visible
            newGhost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }
}
