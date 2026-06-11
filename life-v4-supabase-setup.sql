create table if not exists public.life_games (
  code text primary key,
  state jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.life_games enable row level security;

drop policy if exists "Anyone can read life games" on public.life_games;
drop policy if exists "Anyone can insert life games" on public.life_games;
drop policy if exists "Anyone can update life games" on public.life_games;

create policy "Anyone can read life games" on public.life_games for select using (true);
create policy "Anyone can insert life games" on public.life_games for insert with check (true);
create policy "Anyone can update life games" on public.life_games for update using (true) with check (true);

do $$
begin
  begin
    alter publication supabase_realtime add table public.life_games;
  exception
    when duplicate_object then null;
  end;
end $$;
