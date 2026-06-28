-- Book management app schema

create table public.books (
  id uuid primary key default gen_random_uuid(),
  isbn text,
  title text not null,
  authors text[],
  publisher text,
  published_date text,
  description text,
  thumbnail_url text,
  page_count integer,
  -- Main status (one of these 4)
  status text not null check (status in ('read', 'bought', 'owned', 'wanted')) default 'wanted',
  -- Library flag: can be combined with any status
  is_library boolean not null default false,
  -- User notes
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger books_updated_at
  before update on public.books
  for each row execute function update_updated_at();

-- RLS: enable but allow all for now (add auth later)
alter table public.books enable row level security;

create policy "Allow all operations" on public.books
  for all using (true) with check (true);
