-- Tenant/Landlord profile state. Database roles remain renter/host/admin.
create type public.landlord_status as enum ('none', 'phone_unverified', 'pending_review', 'approved', 'rejected');
alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists phone_verified boolean not null default false;
alter table public.profiles add column if not exists landlord_status public.landlord_status not null default 'none';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, display_name, full_name, email, phone, landlord_status)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''), 80),
    left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', ''), 80),
    lower(coalesce(new.email, '')),
    nullif(new.raw_user_meta_data->>'phone', ''),
    case when new.raw_user_meta_data->>'landlord_requested' = 'true'
      then 'phone_unverified'::public.landlord_status
      else 'none'::public.landlord_status
    end
  );
  return new;
end;
$$;

create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
      or new.landlord_status is distinct from old.landlord_status
      or new.phone_verified is distinct from old.phone_verified then
      raise exception 'Protected profile fields cannot be changed by this user';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_profile_security_fields on public.profiles;
create trigger protect_profile_security_fields
before update on public.profiles
for each row execute procedure public.protect_profile_security_fields();

create policy profile_owner_update on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());
grant update on public.profiles to authenticated;

-- Replace the previous renter -> host promotion with a non-privileged application state.
drop function if exists public.request_host_access();
create function public.request_host_access()
returns public.landlord_status
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.landlord_status;
  current_role public.app_role;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select role, landlord_status into current_role, current_status from public.profiles where id = auth.uid() for update;
  if current_role <> 'renter' then raise exception 'Only tenant accounts can apply as landlords'; end if;
  if current_status = 'none' or current_status = 'rejected' then
    update public.profiles set landlord_status = 'phone_unverified' where id = auth.uid();
    return 'phone_unverified';
  end if;
  return current_status;
end;
$$;
revoke all on function public.request_host_access() from public;
grant execute on function public.request_host_access() to authenticated;

create or replace function public.mark_phone_verified()
returns public.landlord_status
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status public.landlord_status;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from auth.users where id = auth.uid() and phone_confirmed_at is not null) then
    raise exception 'Phone is not verified';
  end if;
  update public.profiles
  set phone_verified = true,
      landlord_status = case when landlord_status in ('phone_unverified', 'rejected') then 'pending_review' else landlord_status end
  where id = auth.uid() and role = 'renter'
  returning landlord_status into next_status;
  return next_status;
end;
$$;
revoke all on function public.mark_phone_verified() from public;
grant execute on function public.mark_phone_verified() to authenticated;

create or replace function public.approve_landlord_application(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  update public.profiles
  set role = 'host', landlord_status = 'approved'
  where id = target_user and landlord_status = 'pending_review' and phone_verified = true;
end;
$$;
revoke all on function public.approve_landlord_application(uuid) from public;
grant execute on function public.approve_landlord_application(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy avatar_insert_own_folder on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatar_update_own_folder on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatar_delete_own_folder on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
