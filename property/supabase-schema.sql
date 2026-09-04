create extension if not exists pgcrypto;

create table if not exists public.lg_listings (
  id uuid primary key default gen_random_uuid(), seller_name text not null, seller_email text not null,
  seller_phone text, founder_email text not null, address text not null, city text not null,
  price text not null, property_type text, beds_baths text, sqft integer, description text,
  agent_name text, agent_email text, agent_phone text, rooms jsonb not null default '[]'::jsonb,
  status text not null default 'demo' check (status in ('demo','active','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.lg_founder_usage (
  founder_email text primary key, tier text not null check (tier in ('founding_1000','corporate_5000')),
  lifetime_uses_allowed integer default 5, lifetime_uses_used integer default 0,
  monthly_cap integer default 30, month_key text, month_uses_used integer default 0,
  updated_at timestamptz not null default now()
);

alter table public.lg_listings enable row level security;
create policy "public can read active listings" on public.lg_listings for select to anon, authenticated using (status='active');
create policy "visitors can create demos" on public.lg_listings for insert to anon, authenticated with check (status='demo');

create or replace function public.get_listing_by_id(p_listing_id uuid)
returns jsonb language sql stable security definer set search_path=public
as $$ select to_jsonb(l) - 'seller_email' - 'founder_email' from public.lg_listings l where id=p_listing_id and status in ('demo','active') $$;
revoke all on function public.get_listing_by_id(uuid) from public;
grant execute on function public.get_listing_by_id(uuid) to anon, authenticated;

insert into storage.buckets (id,name,public) values ('lg-listing-media','lg-listing-media',true) on conflict (id) do update set public=true;
create policy "public listing media is viewable" on storage.objects for select to public using (bucket_id='lg-listing-media');
create policy "visitors can upload listing media" on storage.objects for insert to anon, authenticated with check (bucket_id='lg-listing-media');

create table if not exists public.lg_property_bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.lg_listings(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  tour_at timestamptz not null,
  note text,
  status text not null default 'requested' check (status in ('requested','confirmed','completed','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.lg_property_bookings enable row level security;

create policy "buyers can request property tours"
on public.lg_property_bookings for insert to anon, authenticated
with check (char_length(name) between 2 and 100 and char_length(email) between 3 and 254);
