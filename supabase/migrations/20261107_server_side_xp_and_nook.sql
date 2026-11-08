-- Server-side checks for pet XP and nook decor (2026-11-07). See supabase/SQL_CHANGES.md #15 for the revert.

-- 1. switch_pet used the XP total the phone sent, so an edited request could give a pet extra levels.
--    The total is now worked out here, with the same weights as xpFromCounts() in src/lib/pet.ts
--    (prayed 10, shared 20, journal 5, plus quest XP). p_total stays in the signature so the app keeps working; it's ignored.
create or replace function public.account_xp(uid uuid)
 returns integer
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select (
      (select count(*) from prayer_interactions where user_id = uid and action = 'prayed') * 10
    + (select count(*) from prayers where user_id = uid) * 20
    + (select count(*) from biography_entries where user_id = uid) * 5
    + (select coalesce(sum(xp), 0) from quest_completions where user_id = uid)
  )::integer;
$function$;
revoke all on function public.account_xp(uuid) from public, anon, authenticated;

create or replace function public.switch_pet(p_from text, p_to text, p_total integer)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  allowed constant text[] := array[
    'lamb', 'dove', 'lion', 'ember', 'dragon', 'pumpkin', 'turkey', 'donkey',
    'rat', 'ox', 'tiger', 'rabbit', 'loong', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];
  st public.pet_state%rowtype;
  total int;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  if not (p_from = any(allowed)) or not (p_to = any(allowed)) then
    raise exception 'unknown_pet';
  end if;
  total := public.account_xp(uid);

  select * into st from public.pet_state where user_id = uid for update;
  if not found then
    insert into public.pet_state (user_id, active_pet, active_since_xp)
    values (uid, p_from, 0)
    on conflict (user_id) do nothing;
    select * into st from public.pet_state where user_id = uid for update;
  end if;

  if st.active_pet = p_to then
    return;
  end if;

  insert into public.pet_xp (user_id, pet_id, banked_xp)
  values (uid, st.active_pet, greatest(total - st.active_since_xp, 0))
  on conflict (user_id, pet_id)
    do update set banked_xp = public.pet_xp.banked_xp + excluded.banked_xp;

  update public.pet_state
     set active_pet = p_to, active_since_xp = total, updated_at = now()
   where user_id = uid;
end;
$function$;

-- 2. The nook layout is saved straight from the phone, so paid decor could be saved without buying it.
--    On every save, pieces and scenes that are sold in the store (public.cosmetic_products) and not owned
--    (public.user_cosmetics, or the 'plus' bundle) are taken out. Free and earned pieces are untouched.
create or replace function public.strip_unowned_nook()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  has_plus boolean;
  kept jsonb;
  dropped text[];
begin
  if new.nook is null or jsonb_typeof(new.nook) <> 'object' then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.nook is not distinct from old.nook then
    return new;
  end if;

  select exists (select 1 from user_cosmetics where user_id = new.user_id and product_id = 'plus') into has_plus;
  if has_plus then
    return new;
  end if;

  if jsonb_typeof(new.nook -> 'items') = 'array' then
    select coalesce(jsonb_agg(i) filter (where keep), '[]'::jsonb),
           coalesce(array_agg(i) filter (where not keep), '{}')
      into kept, dropped
      from (
        select t.i,
               not exists (select 1 from cosmetic_products p where p.id = 'item:' || t.i and coalesce(p.price_cents, 0) > 0)
               or exists (select 1 from user_cosmetics c where c.user_id = new.user_id and c.product_id = 'item:' || t.i) as keep
          from jsonb_array_elements_text(new.nook -> 'items') as t(i)
      ) s;
    new.nook := jsonb_set(new.nook, '{items}', kept);
    if array_length(dropped, 1) > 0 and jsonb_typeof(new.nook -> 'offsets') = 'object' then
      new.nook := jsonb_set(new.nook, '{offsets}', (new.nook -> 'offsets') - dropped);
    end if;
  end if;

  if jsonb_typeof(new.nook -> 'scene') = 'string'
     and exists (select 1 from cosmetic_products p where p.id = 'scene:' || (new.nook ->> 'scene') and coalesce(p.price_cents, 0) > 0)
     and not exists (select 1 from user_cosmetics c where c.user_id = new.user_id and c.product_id = 'scene:' || (new.nook ->> 'scene')) then
    new.nook := jsonb_set(new.nook, '{scene}', '"night"');
  end if;

  return new;
end;
$function$;
revoke all on function public.strip_unowned_nook() from public, anon, authenticated;

drop trigger if exists user_progress_strip_unowned_nook on public.user_progress;
create trigger user_progress_strip_unowned_nook
  before insert or update of nook on public.user_progress
  for each row execute function public.strip_unowned_nook();
