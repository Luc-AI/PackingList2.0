import './style.css';
import { initTheme } from './theme.js';
import { createItemElement, createGhostElement, renderList, updateProgress } from './ui.js';
import { initDragAndDrop } from './drag-drop.js';

// Auth & Data
import { authStore } from './store/auth.js';
import { ItemService } from './services/items.js';
import { renderAuthForm, renderUserProfile } from './components/auth-ui.js';

// --- State ---
let items = []; // RAM items
const ID_PREFIX = 'id_' + Date.now() + '_';

// --- DOM Elements ---
const appContent = document.getElementById('app-content');
const itemList = document.getElementById('item-list');
const resetBtn = document.getElementById('reset-btn');
const headerTitleDiv = document.querySelector('.header-main div:last-child');

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    authStore.subscribe(state => handleAuthStateChange(state));
});

async function handleAuthStateChange(state) {
    const { user, loading } = state;

    if (loading) {
        appContent.innerHTML = '<div style="text-align:center; padding: 20px;">Loading...</div>';
        return;
    }

    if (!user) {
        // --- UNAUTHENTICATED ---
        appContent.innerHTML = '';
        appContent.appendChild(renderAuthForm());

        document.querySelector('.progress-container').style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'none';

        const existingProfile = document.getElementById('user-profile-header');
        if (existingProfile) existingProfile.remove();

        items = []; // Clear data
        return;
    }

    // --- AUTHENTICATED ---
    appContent.innerHTML = '';
    appContent.appendChild(itemList);
    itemList.style.display = 'block';

    document.querySelector('.progress-container').style.display = 'block';
    if (resetBtn) resetBtn.style.display = 'flex';

    // Fetch Data
    try {
        appContent.insertAdjacentHTML('afterbegin', '<div id="loading-indicator">Loading items...</div>');
        items = await ItemService.fetchAll();
        document.getElementById('loading-indicator')?.remove();
    } catch (err) {
        console.error("Failed to load items", err);
        items = [];
    }

    renderList(itemList, items, () => updateProgress(items));

    // Setup Sortable (optimistic update needed for reorder, but DB persistence for reorder is TODO)
    initDragAndDrop(itemList, items, (newItems) => {
        items = newItems;
        updateProgress(items);
        // Note: We are NOT persisting sort order to DB in this step yet (MVP simplification).
        // If user refreshes, they might sort by created_at.
    });

    if (!document.getElementById('user-profile-header')) {
        const profile = renderUserProfile(user);
        profile.id = 'user-profile-header';
        headerTitleDiv.appendChild(profile);
    }
}

// --- Event Listeners (Async DB Actions) ---

itemList.addEventListener('click', async (e) => {

    const itemEl = e.target.closest('.item');
    if (!itemEl || itemEl.classList.contains('ghost')) return;

    const id = itemEl.dataset.id;
    const item = items.find(i => i.id === id);

    // Checkbox
    if (e.target.closest('.checkbox')) {
        if (item) {
            // Optimistic Update
            item.checked = !item.checked;
            itemEl.classList.toggle('checked');
            updateProgress(items);

            // DB Update
            try {
                await ItemService.update(id, { checked: item.checked });
            } catch (err) {
                console.error("Checkbox failed", err);
                // Rollback
                item.checked = !item.checked;
                itemEl.classList.toggle('checked');
                updateProgress(items);
                alert("Failed to update item.");
            }
        }
    }
    // Delete
    else if (e.target.closest('.delete-btn')) {
        if (confirm('Delete this item?')) {
            // Optimistic
            const idx = items.findIndex(i => i.id === id);
            if (idx > -1) items.splice(idx, 1);
            itemEl.remove();
            updateProgress(items);

            try {
                await ItemService.remove(id);
            } catch (err) {
                console.error("Delete failed", err);
                alert("Failed to delete item.");
                // Hard to rollback UI easily without re-render, so for now just alert.
            }
        }
    }
});

// Content Edits (Debounced or on Blur)
itemList.addEventListener('focusout', async (e) => {
    if (e.target.classList.contains('item-text')) {
        const itemEl = e.target.closest('.item');
        if (itemEl && !itemEl.classList.contains('ghost')) {
            const id = itemEl.dataset.id;
            const item = items.find(i => i.id === id);
            const newText = e.target.innerText;

            if (item && item.text !== newText) {
                const oldText = item.text;
                item.text = newText;
                try {
                    await ItemService.update(id, { text: newText });
                } catch (err) {
                    console.error("Text update failed", err);
                    item.text = oldText;
                    e.target.innerText = oldText;
                }
            }
        }
    }
});

itemList.addEventListener('keydown', (e) => {
    // debugger; // Removed debugger
    if (e.key === 'Enter' && e.target.classList.contains('item-text')) {
        e.preventDefault();
        const itemEl = e.target.closest('.item');
        if (itemEl && itemEl.classList.contains('ghost')) {
            console.log('[UI] Enter pressed on ghost item');
            commitGhost(itemEl, true);
        } else {
            console.log('[UI] Enter pressed on normal item');
            e.target.blur(); // Triggers focusout -> save
        }
    }
});

// Special Ghost Handler (focusout logic for Ghost logic is tricky with async)
// We already have a focusout listener above, but it checks !ghost. 
// We need one for ghost.
itemList.addEventListener('focusout', (e) => {
    if (e.target.classList.contains('item-text')) {
        const itemEl = e.target.closest('.item');
        if (itemEl && itemEl.classList.contains('ghost')) {
            if (e.target.innerText.trim()) {
                console.log('[UI] Focus out on ghost item -> committing');
                commitGhost(itemEl, false);
            } else {
                e.target.innerText = '';
            }
        }
    }
});

if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
        if (confirm('Delete all items?')) {
            // NOTE: Changing behavior from "Uncheck All" to "Delete All" or "Uncheck All"?
            // Previous code was "Uncheck all". 
            // DB-wise, unchecking all is N updates. 
            // Let's stick to "Uncheck all" for consistency with existing UI text ("Reset").

            // Optimistic
            items.forEach(i => i.checked = false);
            // Re-render to show updates
            const checks = itemList.querySelectorAll('.item.checked');
            checks.forEach(el => el.classList.remove('checked'));
            updateProgress(items);

            try {
                // Batch update difficult with REST, so we loop (inefficient but works for small lists)
                // Or we could add a DB function. For MVP: Loop.
                await Promise.all(items.map(item => ItemService.update(item.id, { checked: false })));
            } catch (err) {
                console.error("Reset failed", err);
                alert("Failed to reset items.");
            }
        }
    });
}

async function commitGhost(ghostEl, shouldFocus) {
    if (ghostEl.dataset.isCommitting === 'true') {
        console.warn('[UI] Prevented double commit on ghost item');
        return;
    }

    const text = ghostEl.querySelector('.item-text').innerText.trim();
    if (!text) return;

    // Mark as committing to prevent race conditions (Enter -> Blur -> Focusout)
    ghostEl.dataset.isCommitting = 'true';
    console.log('[App] Committing new item:', text);
    // So we must wait for DB.

    // Disable inputs?
    const input = ghostEl.querySelector('.item-text');
    input.contentEditable = "false";

    try {
        const newItem = await ItemService.add(text);
        items.push(newItem);
        updateProgress(items);

        // Convert Ghost
        ghostEl.classList.remove('ghost');
        ghostEl.dataset.id = newItem.id;
        input.contentEditable = "true";

        // Append new Ghost
        const newGhost = createGhostElement();
        itemList.appendChild(newGhost);

        if (shouldFocus) {
            requestAnimationFrame(() => {
                const textEl = newGhost.querySelector('.item-text');
                if (textEl) textEl.focus();
                newGhost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }
    } catch (err) {
        console.error("Create failed", err);
        alert("Failed to create item.");
        input.contentEditable = "true";
    }
}
