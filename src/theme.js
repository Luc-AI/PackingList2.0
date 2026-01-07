import { MOON_ICON, SUN_ICON } from './icons.js';
import { getTheme, saveTheme } from './storage.js';

let currentTheme = getTheme();
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

export function initTheme() {
    applyTheme();

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            saveTheme(currentTheme);
            applyTheme();
        });
    }
}

function applyTheme() {
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeToggleBtn) themeToggleBtn.innerHTML = SUN_ICON;
    } else {
        body.classList.remove('dark-mode');
        if (themeToggleBtn) themeToggleBtn.innerHTML = MOON_ICON;
    }
}
