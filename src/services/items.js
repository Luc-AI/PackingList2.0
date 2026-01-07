import { supabase } from '../lib/supabase.js';

export const ItemService = {
    async fetchAll() {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: true }); // Simple chronological sort for now

        if (error) throw error;

        // Map DB shape to App shape if needed
        return data.map(item => ({
            id: item.id,
            text: item.text,
            checked: item.is_checked
        }));
    },

    async add(text) {
        const { data, error } = await supabase
            .from('items')
            .insert([{ text, is_checked: false }])
            .select() // Return the created item so we get the ID
            .single();

        if (error) throw error;

        return {
            id: data.id,
            text: data.text,
            checked: data.is_checked
        };
    },

    async update(id, updates) {
        // Map app keys to DB keys
        const dbUpdates = {};
        if (updates.text !== undefined) dbUpdates.text = updates.text;
        if (updates.checked !== undefined) dbUpdates.is_checked = updates.checked;

        const { error } = await supabase
            .from('items')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
    },

    async remove(id) {
        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async removeAll() {
        // Deletes all items for the user (RLS ensures only their own)
        const { error } = await supabase
            .from('items')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete where id is not "impossible UUID"
        // Or better: .gt('created_at', '1970-01-01') ?
        // Supabase delete needs a filter usually to be safe.

        if (error) throw error;
    }
};
