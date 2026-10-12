import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const foundation = readFileSync(join(root, 'supabase/migrations/001_foundation.sql'), 'utf8');
const hostAccess = readFileSync(join(root, 'supabase/migrations/002_self_service_host_access.sql'), 'utf8');

 test('self-service host access is a renter-only database transition', () => {
  assert.match(hostAccess, /if auth\.uid\(\) is null/i);
  assert.match(hostAccess, /if existing_role <> 'renter'/i);
  assert.match(hostAccess, /set role = 'host'/i);
  assert.match(hostAccess, /where id = auth\.uid\(\) and role = 'renter'/i);
  assert.match(hostAccess, /grant execute on function public\.request_host_access\(\) to authenticated/i);
  assert.doesNotMatch(hostAccess, /role\s*=\s*'admin'/i);
});

test('authenticated clients cannot directly update profile roles', () => {
  assert.match(foundation, /revoke all on public\.profiles from anon, authenticated/i);
  assert.match(foundation, /grant select on public\.profiles to authenticated/i);
  assert.doesNotMatch(foundation, /grant .*update .*public\.profiles/i);
});

test('property publication remains admin-gated and demo listings stay isolated', () => {
  assert.match(foundation, /property_host_insert[\s\S]*public\.is_host\(\)[\s\S]*status = 'draft'[\s\S]*not is_demo/i);
  assert.match(foundation, /property_admin_update[\s\S]*public\.is_admin\(\)/i);
  assert.match(foundation, /property_public_read[\s\S]*status = 'published'/i);
  assert.match(foundation, /inquiry_insert[\s\S]*p\.status = 'published'[\s\S]*not p\.is_demo/i);
});
