import Sortable from 'sortablejs';
import { saveItems } from './storage.js';

export function initDragAndDrop(itemList, items, onReorder) {
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

            // Callback to save and potentially re-render or just save
            if (onReorder) onReorder(items);
            else saveItems(items);
        },
    });
}
