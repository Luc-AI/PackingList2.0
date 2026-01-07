import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getItems, saveItems } from './storage.js';
import { createItemElement, updateProgress } from './ui.js';

// --- Storage Tests ---
describe('Storage Module', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should return empty array if no items in localStorage', () => {
        const items = getItems();
        expect(items).toEqual([]);
    });

    it('should save items to localStorage', () => {
        const mockItems = [{ id: '1', text: 'Toothbrush', checked: false }];
        saveItems(mockItems);

        expect(localStorage.getItem('packlist_items')).toBe(JSON.stringify(mockItems));
    });

    it('should retrieve saved items', () => {
        const mockItems = [{ id: '1', text: 'Toothbrush', checked: false }];
        localStorage.setItem('packlist_items', JSON.stringify(mockItems));

        const items = getItems();
        expect(items).toEqual(mockItems);
    });
});

// --- UI Tests (DOM) ---
// @vitest-environment jsdom
describe('UI Module', () => {
    it('should create an item element with correct text', () => {
        const item = { id: 'abc', text: 'Passport', checked: false };
        const el = createItemElement(item);

        expect(el.tagName).toBe('LI');
        expect(el.dataset.id).toBe('abc');
        expect(el.querySelector('.item-text').textContent).toBe('Passport');
        expect(el.classList.contains('checked')).toBe(false);
    });

    it('should create a checked item element', () => {
        const item = { id: 'def', text: 'Socks', checked: true };
        const el = createItemElement(item);

        expect(el.classList.contains('checked')).toBe(true);
    });

    it('should update progress bar correctly', () => {
        // Setup DOM
        document.body.innerHTML = `
            <span id="progress-percent"></span>
            <span id="progress-count"></span>
            <div id="progress-fill"></div>
        `;

        const items = [
            { checked: true },
            { checked: true },
            { checked: false },
            { checked: false }
        ]; // 50%

        updateProgress(items);

        expect(document.getElementById('progress-percent').innerText).toBe('50% Packed');
        expect(document.getElementById('progress-count').innerText).toBe('2/4 items');
        expect(document.getElementById('progress-fill').style.width).toBe('50%');
    });
});
