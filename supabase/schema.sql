-- Satão — schema Supabase (rode uma vez no SQL editor do seu projeto)
-- Ordem: tabelas -> admins -> RLS -> storage. Idempotente (pode rodar de novo sem quebrar).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  name text,
  approved boolean not null default false,
  client_token text not null
);

create table if not exists community_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  image_path text not null,
  thumb_path text not null,
  caption text,
  author_name text,
  consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  client_token text not null
);

create table if not exists agenda_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  event_date date,
  description text,
  location text,
  published boolean not null default false,
  sort_order int not null default 0
);

create table if not exists gallery_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text,
  category text,
  image_path text not null,
  published boolean not null default false,
  sort_order int not null default 0
);

-- Só existe um admin (você). Guardamos o user_id do Supabase Auth aqui em vez
-- de cravar o UUID em cada política, assim dá pra trocar/adicionar admin sem
-- reescrever RLS.
create table if not exists admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

grant execute on function is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Grants de tabela (RLS abaixo decide quais LINHAS; isso libera a operação)
-- ---------------------------------------------------------------------------

grant select, insert on reviews to anon;
grant select, insert, update, delete on reviews to authenticated;

grant select, insert on community_photos to anon;
grant select, insert, update, delete on community_photos to authenticated;

grant select on agenda_items to anon;
grant select, insert, update, delete on agenda_items to authenticated;

grant select on gallery_items to anon;
grant select, insert, update, delete on gallery_items to authenticated;

grant select on admins to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table reviews enable row level security;
alter table community_photos enable row level security;
alter table agenda_items enable row level security;
alter table gallery_items enable row level security;
alter table admins enable row level security;

drop policy if exists "public insert reviews" on reviews;
create policy "public insert reviews" on reviews
  for insert to anon
  with check (
    not exists (
      select 1 from reviews r2
      where r2.client_token = reviews.client_token
        and r2.created_at > now() - interval '1 day'
    )
  );

drop policy if exists "public read approved reviews" on reviews;
create policy "public read approved reviews" on reviews
  for select to anon
  using (approved = true);

drop policy if exists "admin full reviews" on reviews;
create policy "admin full reviews" on reviews
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "public insert photos" on community_photos;
create policy "public insert photos" on community_photos
  for insert to anon
  with check (
    consent = true
    and not exists (
      select 1 from community_photos p2
      where p2.client_token = community_photos.client_token
        and p2.created_at > now() - interval '1 day'
    )
  );

drop policy if exists "public read approved photos" on community_photos;
create policy "public read approved photos" on community_photos
  for select to anon
  using (status = 'approved');

drop policy if exists "admin full photos" on community_photos;
create policy "admin full photos" on community_photos
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "public read published agenda" on agenda_items;
create policy "public read published agenda" on agenda_items
  for select to anon
  using (published = true);

drop policy if exists "admin full agenda" on agenda_items;
create policy "admin full agenda" on agenda_items
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "public read published gallery" on gallery_items;
create policy "public read published gallery" on gallery_items
  for select to anon
  using (published = true);

drop policy if exists "admin full gallery" on gallery_items;
create policy "admin full gallery" on gallery_items
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admin reads admins" on admins;
create policy "admin reads admins" on admins
  for select to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------------
-- Storage
-- Crie os buckets pelo painel (Storage → New bucket) ANTES de rodar isto:
--   community-photos: público, limite 8 MB, mime jpg/png/webp
--   gallery:          público, sem limite especial
-- ---------------------------------------------------------------------------

drop policy if exists "anon upload community photos" on storage.objects;
create policy "anon upload community photos" on storage.objects
  for insert to anon
  with check (bucket_id = 'community-photos');

-- ponytail: leitura pública por caminho aleatório (sem join pra status),
-- então uma foto pendente é "invisível" mas não criptograficamente privada.
-- Upgrade se precisar de sigilo real: bucket privado + signed URL emitida
-- por uma Edge Function que checa community_photos.status antes de assinar.
drop policy if exists "public read community photos" on storage.objects;
create policy "public read community photos" on storage.objects
  for select to anon
  using (bucket_id = 'community-photos');

drop policy if exists "admin manage community photos" on storage.objects;
create policy "admin manage community photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'community-photos' and is_admin())
  with check (bucket_id = 'community-photos' and is_admin());

drop policy if exists "public read gallery bucket" on storage.objects;
create policy "public read gallery bucket" on storage.objects
  for select to anon
  using (bucket_id = 'gallery');

drop policy if exists "admin manage gallery bucket" on storage.objects;
create policy "admin manage gallery bucket" on storage.objects
  for all to authenticated
  using (bucket_id = 'gallery' and is_admin())
  with check (bucket_id = 'gallery' and is_admin());

-- ---------------------------------------------------------------------------
-- Depois de rodar tudo isso, crie seu usuário admin em
-- Authentication → Users → Add user, copie o UUID dele e rode:
--   insert into admins (user_id) values ('COLE-O-UUID-AQUI');
-- ---------------------------------------------------------------------------
