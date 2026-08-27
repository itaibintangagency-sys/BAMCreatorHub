-- ============================================================
-- Bintang Creator Hub — skema awal + Row Level Security
-- Jalankan di Supabase SQL Editor pada project baru kamu
-- ============================================================

-- ---------- AUTH & ROLE ----------

create table cm_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  email text not null,
  role text not null check (role in ('super_admin','cm')),
  created_at timestamptz default now()
);

create table creators (
  id uuid primary key references auth.users(id) on delete cascade,
  creator_code text unique not null,
  nama text not null,
  no_telepon text,
  status_golden_tick boolean default false,
  assigned_cm_id uuid references cm_profiles(id),
  created_at timestamptz default now()
);

-- ---------- PRODUK ----------

create table category_taxonomy (
  id serial primary key,
  kategori_l1 text not null,
  kategori_l2 text,
  kategori_l3 text
);

create table products (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  campaign_link text not null,
  price_range text,
  rating numeric(2,1),
  sales_count integer default 0,
  store_name text,
  category text,
  campaign_deadline date,
  commission_rate text,
  product_image text,
  image_source text check (image_source in ('auto','manual')),
  image_status text default 'pending',
  is_featured boolean default false,
  created_by uuid references cm_profiles(id),
  created_at timestamptz default now()
);

-- ---------- TUTORIAL ----------

create table tutorials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text check (category in ('Live','Video','Ads','Campaign')),
  level text check (level in ('Basic','Intermediate','Advanced')),
  description text,
  is_onboarding_required boolean default false,
  order_in_path integer,
  last_updated timestamptz default now()
);

create table tutorial_materials (
  id uuid primary key default gen_random_uuid(),
  tutorial_id uuid references tutorials(id) on delete cascade,
  order_index integer not null,
  type text check (type in ('video','reading','quiz')),
  content_url text
);

create table tutorial_progress (
  creator_id uuid references creators(id) on delete cascade,
  material_id uuid references tutorial_materials(id) on delete cascade,
  status text default 'belum' check (status in ('belum','sedang','selesai')),
  completed_at timestamptz,
  primary key (creator_id, material_id)
);

-- ---------- WEBINAR ----------

create table webinars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text check (category in ('Non SVTC','Bintang Next Level','Golden Tick Acceleration','Golden Tick Shopee Pusat')),
  event_date date not null,
  event_time text,
  eligibility_type text check (eligibility_type in ('Eligible for All','Invite Only','Golden Tick Only')),
  registration_link text,
  recording_link text,
  description text,
  created_by uuid references cm_profiles(id)
);

create table webinar_attendance (
  creator_id uuid references creators(id) on delete cascade,
  webinar_id uuid references webinars(id) on delete cascade,
  reported_at timestamptz default now(),
  primary key (creator_id, webinar_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table cm_profiles enable row level security;
alter table creators enable row level security;
alter table products enable row level security;
alter table category_taxonomy enable row level security;
alter table tutorials enable row level security;
alter table tutorial_materials enable row level security;
alter table tutorial_progress enable row level security;
alter table webinars enable row level security;
alter table webinar_attendance enable row level security;

-- Helper: cek role user yang sedang login
create or replace function current_role_is(check_role text) returns boolean as $$
  select exists (
    select 1 from cm_profiles where id = auth.uid() and role = check_role
  );
$$ language sql security definer;

create or replace function is_internal_user() returns boolean as $$
  select exists (select 1 from cm_profiles where id = auth.uid());
$$ language sql security definer;

-- cm_profiles: internal bisa lihat semua profil internal
create policy "internal read cm_profiles" on cm_profiles
  for select using (is_internal_user());

-- creators: Creator lihat dirinya sendiri, CM lihat yang di-assign, Super Admin lihat semua
create policy "creator read self" on creators
  for select using (id = auth.uid());
create policy "cm read assigned creators" on creators
  for select using (current_role_is('cm') and assigned_cm_id = auth.uid());
create policy "super_admin read all creators" on creators
  for select using (current_role_is('super_admin'));
create policy "internal manage creators" on creators
  for insert with check (is_internal_user());
create policy "internal update creators" on creators
  for update using (is_internal_user());

-- products, tutorials, webinars, category_taxonomy: semua user login bisa baca (konten bersama)
create policy "everyone read products" on products for select using (auth.uid() is not null);
create policy "internal write products" on products for insert with check (is_internal_user());
create policy "internal update products" on products for update using (is_internal_user());

create policy "everyone read category_taxonomy" on category_taxonomy for select using (auth.uid() is not null);

create policy "everyone read tutorials" on tutorials for select using (auth.uid() is not null);
create policy "internal write tutorials" on tutorials for insert with check (is_internal_user());
create policy "internal update tutorials" on tutorials for update using (is_internal_user());

create policy "everyone read tutorial_materials" on tutorial_materials for select using (auth.uid() is not null);
create policy "internal write tutorial_materials" on tutorial_materials for insert with check (is_internal_user());

create policy "everyone read webinars" on webinars for select using (auth.uid() is not null);
create policy "internal write webinars" on webinars for insert with check (is_internal_user());
create policy "internal update webinars" on webinars for update using (is_internal_user());

-- tutorial_progress: Creator baca & tulis progress dirinya sendiri, CM/SA baca progress Creator binaan
create policy "creator manage own progress" on tutorial_progress
  for all using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "internal read progress" on tutorial_progress
  for select using (is_internal_user());

-- webinar_attendance: sama polanya seperti tutorial_progress
create policy "creator manage own attendance" on webinar_attendance
  for all using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "internal read attendance" on webinar_attendance
  for select using (is_internal_user());
