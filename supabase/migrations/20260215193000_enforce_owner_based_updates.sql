/*
  # Enforce Owner-Based Listing Updates

  1. Schema
    - Add `owner_id` to `products` (linked to auth.users)

  2. Security
    - Keep read access for authenticated users
    - Restrict insert to the signed-in owner (`owner_id = auth.uid()`)
    - Restrict update to rows owned by the signed-in user
*/

alter table public.products
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table public.products enable row level security;

drop policy if exists "Authenticated can view products" on public.products;
drop policy if exists "Authenticated can create products" on public.products;
drop policy if exists "Authenticated can update products" on public.products;

create policy "Authenticated can view products"
on public.products
for select
to authenticated
using (true);

create policy "Authenticated can create products"
on public.products
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Authenticated can update products"
on public.products
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
