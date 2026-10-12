-- Apply to a new Supabase project. Never expose a service-role key in the browser.
create type public.app_role as enum ('renter', 'host', 'admin');
create type public.property_status as enum ('draft', 'pending_review', 'published', 'rejected');
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 role public.app_role not null default 'renter'
);
create table public.properties (
 id uuid primary key default gen_random_uuid(),
 host_id uuid not null references public.profiles(id),
 title text not null check (length(title) between 3 and 120),
 city text not null, neighborhood text not null,
 monthly_rent numeric(12,2) not null check (monthly_rent > 0),
 monthly_dues numeric(12,2) not null default 0 check (monthly_dues >= 0),
 cleaning_fee numeric(12,2) not null default 0 check (cleaning_fee >= 0),
 security_deposit numeric(12,2) not null default 0 check (security_deposit >= 0),
 area_sqm numeric not null check (area_sqm > 0),
 min_months int not null default 1 check (min_months between 1 and 24),
 furnished boolean not null default true,
 is_demo boolean not null default false,
 status public.property_status not null default 'draft',
 created_at timestamptz not null default now()
);
create table public.inquiries (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id),
 renter_id uuid not null references public.profiles(id),
 move_in date not null, months int not null check (months between 1 and 24),
 message text not null check (length(message) between 10 and 2000),
 consent_at timestamptz not null default now(),
 status text not null default 'new' check (status in ('new','responded','closed')),
 created_at timestamptz not null default now()
);
create table public.saved_properties (
 user_id uuid references public.profiles(id) on delete cascade,
 property_id uuid references public.properties(id) on delete cascade,
 primary key (user_id, property_id)
);
create index properties_host_idx on public.properties(host_id);
create index inquiries_property_idx on public.inquiries(property_id);
create index inquiries_renter_idx on public.inquiries(renter_id);
create function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;
create function public.is_host() returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.profiles where id = auth.uid() and role in ('host','admin')); $$;
revoke all on function public.is_admin() from public;
revoke all on function public.is_host() from public;
grant execute on function public.is_admin(), public.is_host() to authenticated;
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.inquiries enable row level security;
alter table public.saved_properties enable row level security;
create policy profile_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
-- Roles are changed only through trusted database functions/tooling, never profile forms.
create policy property_public_read on public.properties for select to anon, authenticated using (status = 'published');
create policy property_owner_read on public.properties for select to authenticated using (host_id = auth.uid() or public.is_admin());
create policy property_host_insert on public.properties for insert to authenticated with check (host_id = auth.uid() and public.is_host() and status = 'draft' and not is_demo);
create policy property_host_update on public.properties for update to authenticated using (host_id = auth.uid() and public.is_host() and status in ('draft','rejected')) with check (host_id = auth.uid() and status in ('draft','pending_review') and not is_demo);
create policy property_admin_update on public.properties for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy inquiry_read on public.inquiries for select to authenticated using (renter_id = auth.uid() or public.is_admin() or exists (select 1 from public.properties p where p.id = property_id and p.host_id = auth.uid()));
create policy inquiry_insert on public.inquiries for insert to authenticated with check (renter_id = auth.uid() and move_in >= current_date and status = 'new' and exists (select 1 from public.properties p where p.id = property_id and p.status = 'published' and not p.is_demo and months >= p.min_months));
create policy saved_owner on public.saved_properties for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Auto-create renter profiles; a trusted operator later assigns host/admin roles.
create function public.new_user_profile() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles(id, display_name) values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', ''), 80)); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.new_user_profile();
revoke all on function public.new_user_profile() from public;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
revoke all on public.properties from anon, authenticated;
grant select on public.properties to anon, authenticated;
grant insert, update on public.properties to authenticated;
revoke all on public.inquiries from anon, authenticated;
grant select, insert on public.inquiries to authenticated;
revoke all on public.saved_properties from anon, authenticated;
grant select, insert, delete on public.saved_properties to authenticated;
