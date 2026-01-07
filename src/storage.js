export function getItems() {
    return JSON.parse(localStorage.getItem('packlist_items')) || [];
}

export function saveItems(items) {
    localStorage.setItem('packlist_items', JSON.stringify(items));
}

export function getTheme() {
    return localStorage.getItem('packlist_theme') || 'light';
}

export function saveTheme(theme) {
    localStorage.setItem('packlist_theme', theme);
}
