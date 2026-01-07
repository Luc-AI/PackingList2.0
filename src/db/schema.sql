-- Create a table for items
create table items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  text text check (char_length(text) > 0),
  is_checked boolean default false,
  order_index serial, -- Simple auto-increment for default order, draggable reorder can update this or use floats
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table items enable row level security;

-- Policy: Users can only see their own items
create policy "Users can view own items" 
  on items for select 
  using (auth.uid() = user_id);

-- Policy: Users can insert their own items
create policy "Users can insert own items" 
  on items for insert 
  with check (auth.uid() = user_id);

-- Policy: Users can update their own items
create policy "Users can update own items" 
  on items for update 
  using (auth.uid() = user_id);

-- Policy: Users can delete their own items
create policy "Users can delete own items" 
  on items for delete 
  using (auth.uid() = user_id);
