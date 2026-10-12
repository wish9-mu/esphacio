-- Self-service host onboarding: only a renter may transition to host.
-- Direct profile role updates remain unavailable to authenticated clients.
create or replace function public.request_host_access()
returns public.app_role
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_role public.app_role;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select role into existing_role
  from public.profiles
  where id = auth.uid()
  for update;

  if existing_role is null then
    raise exception 'Profile not found';
  end if;

  if existing_role <> 'renter' then
    raise exception 'Only renter accounts can request host access';
  end if;

  update public.profiles
  set role = 'host'
  where id = auth.uid() and role = 'renter';

  return 'host'::public.app_role;
end;
$$;

revoke all on function public.request_host_access() from public;
grant execute on function public.request_host_access() to authenticated;
