create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.user_role as enum ('customer', 'barber', 'admin');
create type public.appointment_status as enum ('booked', 'completed', 'cancelled');
create type public.queue_status as enum ('waiting', 'assigned', 'completed', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'refunded', 'failed');
create type public.payment_mode as enum ('cash', 'card', 'upi', 'wallet', 'unknown');
create type public.invite_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type public.notification_status as enum ('pending', 'processing', 'sent', 'failed');
create type public.audit_actor_type as enum ('customer', 'barber', 'admin', 'system');
create type public.barber_override_type as enum ('leave', 'break', 'day_off', 'custom');

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'customer',
  name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.shop_settings (
  id integer primary key default 1 check (id = 1),
  shop_name text not null default 'Selor Barber Shop',
  timezone text not null default 'Asia/Kolkata',
  weekly_hours jsonb not null default '{
    "0":{"enabled":false,"start":"09:00","end":"18:00"},
    "1":{"enabled":true,"start":"09:00","end":"20:00"},
    "2":{"enabled":true,"start":"09:00","end":"20:00"},
    "3":{"enabled":true,"start":"09:00","end":"20:00"},
    "4":{"enabled":true,"start":"09:00","end":"20:00"},
    "5":{"enabled":true,"start":"09:00","end":"20:00"},
    "6":{"enabled":true,"start":"09:00","end":"18:00"}
  }'::jsonb,
  default_buffer_before_minutes integer not null default 5 check (default_buffer_before_minutes >= 0),
  default_buffer_after_minutes integer not null default 5 check (default_buffer_after_minutes >= 0),
  slot_interval_minutes integer not null default 15 check (slot_interval_minutes > 0),
  reminder_lead_minutes integer[] not null default array[120, 30],
  invite_base_url text not null default 'https://example.com/install',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  barber_id uuid not null references public.barbers (id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes >= 0),
  buffer_after_minutes integer not null default 0 check (buffer_after_minutes >= 0),
  delay_minutes integer not null default 0 check (delay_minutes >= 0),
  service_total numeric(10, 2) not null default 0 check (service_total >= 0),
  status public.appointment_status not null default 'booked',
  payment_status public.payment_status not null default 'pending',
  payment_mode public.payment_mode not null default 'unknown',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  blocked_time_range tstzrange generated always as (
    tstzrange(
      start_time - make_interval(mins => buffer_before_minutes),
      end_time + make_interval(mins => buffer_after_minutes),
      '[)'
    )
  ) stored,
  delayed_time_range tstzrange generated always as (
    tstzrange(
      start_time - make_interval(mins => buffer_before_minutes),
      end_time + make_interval(mins => buffer_after_minutes + delay_minutes),
      '[)'
    )
  ) stored,
  constraint appointments_time_order check (end_time > start_time)
);

create table if not exists public.appointment_services (
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  sort_order integer not null default 0,
  service_name_snapshot text not null,
  duration_minutes_snapshot integer not null check (duration_minutes_snapshot > 0),
  price_snapshot numeric(10, 2) not null check (price_snapshot >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (appointment_id, service_id)
);

create table if not exists public.barber_availability_overrides (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers (id) on delete cascade,
  override_type public.barber_override_type not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  created_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint barber_override_time_order check (end_time > start_time)
);

create table if not exists public.queue_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  barber_id uuid references public.barbers (id) on delete set null,
  status public.queue_status not null default 'waiting',
  position integer not null check (position > 0),
  queue_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  inviter_id uuid not null references public.users (id) on delete restrict,
  status public.invite_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.idempotency_keys (
  id bigserial primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  scope text not null,
  key text not null,
  request_hash text,
  response_body jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, scope, key)
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_user_id uuid references public.users (id) on delete set null,
  actor_role public.audit_actor_type not null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_events (
  id bigserial primary key,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  user_id uuid references public.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'pending',
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists users_role_idx on public.users (role) where deleted_at is null;
create index if not exists barbers_active_idx on public.barbers (is_active) where deleted_at is null;
create index if not exists services_active_idx on public.services (is_active) where deleted_at is null;
create index if not exists appointments_user_idx on public.appointments (user_id, created_at desc) where deleted_at is null;
create index if not exists appointments_barber_idx on public.appointments (barber_id, start_time desc) where deleted_at is null;
create index if not exists appointments_status_idx on public.appointments (status) where deleted_at is null;
create index if not exists queue_tokens_lookup_idx on public.queue_tokens (queue_date desc, position asc) where deleted_at is null;
create index if not exists queue_tokens_user_idx on public.queue_tokens (user_id, created_at desc) where deleted_at is null;
create index if not exists barber_overrides_range_idx on public.barber_availability_overrides using gist (barber_id, tstzrange(start_time, end_time, '[)')) where deleted_at is null;
create index if not exists invites_status_idx on public.invites (status, expires_at) where deleted_at is null;
create index if not exists idempotency_scope_idx on public.idempotency_keys (user_id, scope, key);
create index if not exists notification_status_idx on public.notification_events (status, next_attempt_at);

alter table public.appointments
  add constraint appointments_no_overlap_per_barber
  exclude using gist (
    barber_id with =,
    blocked_time_range with &&
  )
  where (deleted_at is null and status = 'booked');

create unique index if not exists queue_tokens_daily_position_idx
  on public.queue_tokens (queue_date, position)
  where deleted_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at before update on public.users
for each row execute procedure public.set_updated_at();

drop trigger if exists barbers_updated_at on public.barbers;
create trigger barbers_updated_at before update on public.barbers
for each row execute procedure public.set_updated_at();

drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at before update on public.services
for each row execute procedure public.set_updated_at();

drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at before update on public.appointments
for each row execute procedure public.set_updated_at();

drop trigger if exists queue_tokens_updated_at on public.queue_tokens;
create trigger queue_tokens_updated_at before update on public.queue_tokens
for each row execute procedure public.set_updated_at();

drop trigger if exists barber_overrides_updated_at on public.barber_availability_overrides;
create trigger barber_overrides_updated_at before update on public.barber_availability_overrides
for each row execute procedure public.set_updated_at();

drop trigger if exists invites_updated_at on public.invites;
create trigger invites_updated_at before update on public.invites
for each row execute procedure public.set_updated_at();

drop trigger if exists idempotency_keys_updated_at on public.idempotency_keys;
create trigger idempotency_keys_updated_at before update on public.idempotency_keys
for each row execute procedure public.set_updated_at();

drop trigger if exists shop_settings_updated_at on public.shop_settings;
create trigger shop_settings_updated_at before update on public.shop_settings
for each row execute procedure public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select role
  from public.users
  where id = auth.uid() and deleted_at is null
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.current_barber_id()
returns uuid
language sql
stable
as $$
  select b.id
  from public.barbers b
  where b.user_id = auth.uid() and b.deleted_at is null
  limit 1
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(excluded.name, public.users.name),
      updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute procedure public.handle_new_auth_user();

create or replace function public.record_audit_event(
  p_actor_user_id uuid,
  p_actor_role public.audit_actor_type,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_before_data jsonb,
  p_after_data jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (
    actor_user_id,
    actor_role,
    entity_type,
    entity_id,
    action,
    before_data,
    after_data
  )
  values (
    p_actor_user_id,
    p_actor_role,
    p_entity_type,
    p_entity_id,
    p_action,
    p_before_data,
    p_after_data
  );
$$;

create or replace function public.enqueue_notification(
  p_event_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_user_id uuid,
  p_payload jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notification_events (
    event_type,
    entity_type,
    entity_id,
    user_id,
    payload
  )
  values (
    p_event_type,
    p_entity_type,
    p_entity_id,
    p_user_id,
    coalesce(p_payload, '{}'::jsonb)
  );
$$;

create or replace function public.current_queue_date()
returns date
language sql
stable
as $$
  select (timezone((select timezone from public.shop_settings where id = 1), timezone('utc', now())))::date
$$;

create or replace function public.create_booking(
  p_barber_id uuid,
  p_service_ids uuid[],
  p_start_time timestamptz,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_role public.user_role;
  v_settings public.shop_settings%rowtype;
  v_duration integer;
  v_total numeric(10, 2);
  v_end_time timestamptz;
  v_appointment public.appointments%rowtype;
  v_existing jsonb;
  v_response jsonb;
  v_service_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select role into v_user_role
  from public.users
  where id = v_user_id and deleted_at is null;

  if v_user_role is null then
    raise exception 'Unknown user';
  end if;

  if coalesce(array_length(p_service_ids, 1), 0) = 0 then
    raise exception 'At least one service is required';
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':booking:create:' || p_idempotency_key));

    select response_body into v_existing
    from public.idempotency_keys
    where user_id = v_user_id
      and scope = 'booking.create'
      and key = p_idempotency_key;

    if v_existing is not null then
      return v_existing;
    end if;

    insert into public.idempotency_keys (user_id, scope, key)
    values (v_user_id, 'booking.create', p_idempotency_key)
    on conflict (user_id, scope, key) do nothing;
  end if;

  select *
  into v_settings
  from public.shop_settings
  where id = 1;

  select count(*), sum(duration_minutes), sum(price)
  into v_service_count, v_duration, v_total
  from public.services
  where id = any(p_service_ids)
    and is_active = true
    and deleted_at is null;

  if v_service_count <> cardinality(p_service_ids) then
    raise exception 'One or more services are unavailable';
  end if;

  if exists (
    select 1
    from public.barber_availability_overrides o
    where o.barber_id = p_barber_id
      and o.deleted_at is null
      and tstzrange(o.start_time, o.end_time, '[)') && tstzrange(
        p_start_time - make_interval(mins => v_settings.default_buffer_before_minutes),
        p_start_time + make_interval(mins => v_duration + v_settings.default_buffer_after_minutes),
        '[)'
      )
  ) then
    v_response := jsonb_build_object(
      'status_code', 409,
      'body', jsonb_build_object(
        'error', jsonb_build_object(
          'code', 'BARBER_UNAVAILABLE',
          'message', 'The barber is unavailable for the selected time.'
        )
      )
    );

    if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
      update public.idempotency_keys
      set response_body = v_response
      where user_id = v_user_id and scope = 'booking.create' and key = p_idempotency_key;
    end if;

    return v_response;
  end if;

  v_end_time := p_start_time + make_interval(mins => v_duration);

  insert into public.appointments (
    user_id,
    barber_id,
    start_time,
    end_time,
    duration_minutes,
    buffer_before_minutes,
    buffer_after_minutes,
    service_total
  )
  values (
    v_user_id,
    p_barber_id,
    p_start_time,
    v_end_time,
    v_duration,
    v_settings.default_buffer_before_minutes,
    v_settings.default_buffer_after_minutes,
    v_total
  )
  returning * into v_appointment;

  insert into public.appointment_services (
    appointment_id,
    service_id,
    sort_order,
    service_name_snapshot,
    duration_minutes_snapshot,
    price_snapshot
  )
  select
    v_appointment.id,
    s.id,
    ordinality - 1,
    s.name,
    s.duration_minutes,
    s.price
  from unnest(p_service_ids) with ordinality as picked(service_id, ordinality)
  join public.services s on s.id = picked.service_id;

  perform public.record_audit_event(
    v_user_id,
    case
      when v_user_role = 'admin' then 'admin'
      when v_user_role = 'barber' then 'barber'
      else 'customer'
    end,
    'appointment',
    v_appointment.id,
    'created',
    null,
    to_jsonb(v_appointment)
  );

  perform public.enqueue_notification(
    'appointment.created',
    'appointment',
    v_appointment.id,
    v_user_id,
    jsonb_build_object('appointment_id', v_appointment.id)
  );

  select jsonb_build_object(
    'status_code', 201,
    'body', jsonb_build_object(
      'appointment', jsonb_build_object(
        'id', v_appointment.id,
        'user_id', v_appointment.user_id,
        'barber_id', v_appointment.barber_id,
        'start_time', v_appointment.start_time,
        'end_time', v_appointment.end_time,
        'duration_minutes', v_appointment.duration_minutes,
        'buffer_before_minutes', v_appointment.buffer_before_minutes,
        'buffer_after_minutes', v_appointment.buffer_after_minutes,
        'delay_minutes', v_appointment.delay_minutes,
        'service_total', v_appointment.service_total,
        'status', v_appointment.status,
        'payment_status', v_appointment.payment_status,
        'payment_mode', v_appointment.payment_mode,
        'services', (
          select jsonb_agg(
            jsonb_build_object(
              'service_id', aps.service_id,
              'name', aps.service_name_snapshot,
              'duration_minutes', aps.duration_minutes_snapshot,
              'price', aps.price_snapshot,
              'sort_order', aps.sort_order
            )
            order by aps.sort_order
          )
          from public.appointment_services aps
          where aps.appointment_id = v_appointment.id
        )
      ),
      'replayed', false
    )
  ) into v_response;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    update public.idempotency_keys
    set response_body = v_response
    where user_id = v_user_id and scope = 'booking.create' and key = p_idempotency_key;
  end if;

  return v_response;
exception
  when exclusion_violation then
    v_response := jsonb_build_object(
      'status_code', 409,
      'body', jsonb_build_object(
        'error', jsonb_build_object(
          'code', 'APPOINTMENT_CONFLICT',
          'message', 'The selected time overlaps with another appointment.'
        )
      )
    );

    if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 and v_user_id is not null then
      update public.idempotency_keys
      set response_body = v_response
      where user_id = v_user_id and scope = 'booking.create' and key = p_idempotency_key;
    end if;

    return v_response;
end;
$$;

create or replace function public.update_booking(
  p_appointment_id uuid,
  p_action text,
  p_start_time timestamptz default null,
  p_barber_id uuid default null,
  p_service_ids uuid[] default null,
  p_payment_status public.payment_status default null,
  p_payment_mode public.payment_mode default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user public.users%rowtype;
  v_barber_id uuid;
  v_settings public.shop_settings%rowtype;
  v_appointment public.appointments%rowtype;
  v_before jsonb;
  v_duration integer;
  v_total numeric(10, 2);
  v_end_time timestamptz;
  v_existing jsonb;
  v_response jsonb;
  v_service_ids uuid[];
  v_service_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_user
  from public.users
  where id = v_user_id and deleted_at is null;

  if v_user.role = 'barber' then
    select id into v_barber_id
    from public.barbers
    where user_id = v_user_id and deleted_at is null;
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':booking:update:' || p_idempotency_key));

    select response_body into v_existing
    from public.idempotency_keys
    where user_id = v_user_id
      and scope = 'booking.update'
      and key = p_idempotency_key;

    if v_existing is not null then
      return v_existing;
    end if;

    insert into public.idempotency_keys (user_id, scope, key)
    values (v_user_id, 'booking.update', p_idempotency_key)
    on conflict (user_id, scope, key) do nothing;
  end if;

  select * into v_appointment
  from public.appointments
  where id = p_appointment_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Appointment not found';
  end if;

  if v_user.role <> 'admin'
     and v_appointment.user_id <> v_user_id
     and (v_user.role <> 'barber' or v_appointment.barber_id <> v_barber_id) then
    raise exception 'Insufficient permissions';
  end if;

  v_before := to_jsonb(v_appointment);

  if p_action = 'cancel' then
    update public.appointments
    set status = 'cancelled'
    where id = p_appointment_id
    returning * into v_appointment;
  elsif p_action = 'payment' then
    if v_user.role = 'customer' then
      raise exception 'Customers cannot update payments';
    end if;

    update public.appointments
    set payment_status = coalesce(p_payment_status, payment_status),
        payment_mode = coalesce(p_payment_mode, payment_mode)
    where id = p_appointment_id
    returning * into v_appointment;
  elsif p_action = 'reschedule' then
    select * into v_settings from public.shop_settings where id = 1;

    select coalesce(p_service_ids, array_agg(service_id order by sort_order))
    into v_service_ids
    from public.appointment_services
    where appointment_id = p_appointment_id;

    select count(*), sum(duration_minutes), sum(price)
    into v_service_count, v_duration, v_total
    from public.services
    where id = any(v_service_ids)
      and is_active = true
      and deleted_at is null;

    if v_service_count <> cardinality(v_service_ids) then
      raise exception 'One or more services are unavailable';
    end if;

    if exists (
      select 1
      from public.barber_availability_overrides o
      where o.barber_id = coalesce(p_barber_id, v_appointment.barber_id)
        and o.deleted_at is null
        and tstzrange(o.start_time, o.end_time, '[)') && tstzrange(
          p_start_time - make_interval(mins => v_settings.default_buffer_before_minutes),
          p_start_time + make_interval(mins => v_duration + v_settings.default_buffer_after_minutes),
          '[)'
        )
    ) then
      v_response := jsonb_build_object(
        'status_code', 409,
        'body', jsonb_build_object(
          'error', jsonb_build_object(
            'code', 'BARBER_UNAVAILABLE',
            'message', 'The barber is unavailable for the selected time.'
          )
        )
      );
      if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
        update public.idempotency_keys
        set response_body = v_response
        where user_id = v_user_id and scope = 'booking.update' and key = p_idempotency_key;
      end if;
      return v_response;
    end if;

    v_end_time := p_start_time + make_interval(mins => v_duration);

    update public.appointments
    set barber_id = coalesce(p_barber_id, barber_id),
        start_time = coalesce(p_start_time, start_time),
        end_time = coalesce(v_end_time, end_time),
        duration_minutes = v_duration,
        service_total = v_total,
        buffer_before_minutes = v_settings.default_buffer_before_minutes,
        buffer_after_minutes = v_settings.default_buffer_after_minutes,
        status = 'booked'
    where id = p_appointment_id
    returning * into v_appointment;

    if p_service_ids is not null then
      delete from public.appointment_services where appointment_id = p_appointment_id;

      insert into public.appointment_services (
        appointment_id,
        service_id,
        sort_order,
        service_name_snapshot,
        duration_minutes_snapshot,
        price_snapshot
      )
      select
        v_appointment.id,
        s.id,
        ordinality - 1,
        s.name,
        s.duration_minutes,
        s.price
      from unnest(p_service_ids) with ordinality as picked(service_id, ordinality)
      join public.services s on s.id = picked.service_id;
    end if;
  else
    raise exception 'Unsupported booking action';
  end if;

  perform public.record_audit_event(
    v_user_id,
    case
      when v_user.role = 'admin' then 'admin'
      when v_user.role = 'barber' then 'barber'
      else 'customer'
    end,
    'appointment',
    v_appointment.id,
    p_action,
    v_before,
    to_jsonb(v_appointment)
  );

  perform public.enqueue_notification(
    'appointment.' || p_action,
    'appointment',
    v_appointment.id,
    v_appointment.user_id,
    jsonb_build_object('appointment_id', v_appointment.id, 'action', p_action)
  );

  v_response := jsonb_build_object(
    'status_code', 200,
    'body', jsonb_build_object(
      'appointment', to_jsonb(v_appointment),
      'replayed', false
    )
  );

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    update public.idempotency_keys
    set response_body = v_response
    where user_id = v_user_id and scope = 'booking.update' and key = p_idempotency_key;
  end if;

  return v_response;
exception
  when exclusion_violation then
    v_response := jsonb_build_object(
      'status_code', 409,
      'body', jsonb_build_object(
        'error', jsonb_build_object(
          'code', 'APPOINTMENT_CONFLICT',
          'message', 'The selected time overlaps with another appointment.'
        )
      )
    );
    if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 and v_user_id is not null then
      update public.idempotency_keys
      set response_body = v_response
      where user_id = v_user_id and scope = 'booking.update' and key = p_idempotency_key;
    end if;
    return v_response;
end;
$$;

create or replace function public.join_queue(
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_role public.user_role;
  v_queue_date date;
  v_existing jsonb;
  v_position integer;
  v_token public.queue_tokens%rowtype;
  v_response jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select role into v_user_role
  from public.users
  where id = v_user_id and deleted_at is null;

  if v_user_role is null then
    raise exception 'Unknown user';
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':queue:join:' || p_idempotency_key));

    select response_body into v_existing
    from public.idempotency_keys
    where user_id = v_user_id and scope = 'queue.join' and key = p_idempotency_key;

    if v_existing is not null then
      return v_existing;
    end if;

    insert into public.idempotency_keys (user_id, scope, key)
    values (v_user_id, 'queue.join', p_idempotency_key)
    on conflict (user_id, scope, key) do nothing;
  end if;

  v_queue_date := public.current_queue_date();
  perform pg_advisory_xact_lock(hashtext('queue:' || v_queue_date::text));

  select coalesce(max(position), 0) + 1 into v_position
  from public.queue_tokens
  where queue_date = v_queue_date and deleted_at is null;

  insert into public.queue_tokens (user_id, position, queue_date)
  values (v_user_id, v_position, v_queue_date)
  returning * into v_token;

  perform public.record_audit_event(
    v_user_id,
    case
      when v_user_role = 'admin' then 'admin'
      when v_user_role = 'barber' then 'barber'
      else 'customer'
    end,
    'queue_token',
    v_token.id,
    'joined',
    null,
    to_jsonb(v_token)
  );

  perform public.enqueue_notification(
    'queue.joined',
    'queue_token',
    v_token.id,
    v_user_id,
    jsonb_build_object('queue_token_id', v_token.id, 'position', v_token.position)
  );

  v_response := jsonb_build_object(
    'status_code', 201,
    'body', jsonb_build_object(
      'queue_token', to_jsonb(v_token),
      'replayed', false
    )
  );

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    update public.idempotency_keys
    set response_body = v_response
    where user_id = v_user_id and scope = 'queue.join' and key = p_idempotency_key;
  end if;

  return v_response;
end;
$$;

create or replace function public.assign_queue_token(
  p_queue_token_id uuid,
  p_barber_id uuid,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user public.users%rowtype;
  v_actor_barber_id uuid;
  v_token public.queue_tokens%rowtype;
  v_before jsonb;
  v_existing jsonb;
  v_response jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_user
  from public.users
  where id = v_user_id and deleted_at is null;

  if v_user.role not in ('admin', 'barber') then
    raise exception 'Insufficient permissions';
  end if;

  if v_user.role = 'barber' then
    select id into v_actor_barber_id
    from public.barbers
    where user_id = v_user_id and deleted_at is null;

    if v_actor_barber_id <> p_barber_id then
      raise exception 'Barbers can only assign queue tokens to themselves';
    end if;
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':queue:assign:' || p_idempotency_key));

    select response_body into v_existing
    from public.idempotency_keys
    where user_id = v_user_id and scope = 'queue.assign' and key = p_idempotency_key;

    if v_existing is not null then
      return v_existing;
    end if;

    insert into public.idempotency_keys (user_id, scope, key)
    values (v_user_id, 'queue.assign', p_idempotency_key)
    on conflict (user_id, scope, key) do nothing;
  end if;

  select * into v_token
  from public.queue_tokens
  where id = p_queue_token_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Queue token not found';
  end if;

  v_before := to_jsonb(v_token);

  update public.queue_tokens
  set barber_id = p_barber_id,
      status = 'assigned'
  where id = p_queue_token_id
  returning * into v_token;

  perform public.record_audit_event(
    v_user_id,
    case when v_user.role = 'admin' then 'admin' else 'barber' end,
    'queue_token',
    v_token.id,
    'assigned',
    v_before,
    to_jsonb(v_token)
  );

  perform public.enqueue_notification(
    'queue.assigned',
    'queue_token',
    v_token.id,
    v_token.user_id,
    jsonb_build_object('queue_token_id', v_token.id, 'barber_id', v_token.barber_id)
  );

  v_response := jsonb_build_object(
    'status_code', 200,
    'body', jsonb_build_object(
      'queue_token', to_jsonb(v_token),
      'replayed', false
    )
  );

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    update public.idempotency_keys
    set response_body = v_response
    where user_id = v_user_id and scope = 'queue.assign' and key = p_idempotency_key;
  end if;

  return v_response;
end;
$$;

create or replace function public.complete_queue_token(
  p_queue_token_id uuid,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user public.users%rowtype;
  v_actor_barber_id uuid;
  v_token public.queue_tokens%rowtype;
  v_before jsonb;
  v_existing jsonb;
  v_response jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_user
  from public.users
  where id = v_user_id and deleted_at is null;

  if v_user.role not in ('admin', 'barber') then
    raise exception 'Insufficient permissions';
  end if;

  if v_user.role = 'barber' then
    select id into v_actor_barber_id
    from public.barbers
    where user_id = v_user_id and deleted_at is null;
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':queue:complete:' || p_idempotency_key));

    select response_body into v_existing
    from public.idempotency_keys
    where user_id = v_user_id and scope = 'queue.complete' and key = p_idempotency_key;

    if v_existing is not null then
      return v_existing;
    end if;

    insert into public.idempotency_keys (user_id, scope, key)
    values (v_user_id, 'queue.complete', p_idempotency_key)
    on conflict (user_id, scope, key) do nothing;
  end if;

  select * into v_token
  from public.queue_tokens
  where id = p_queue_token_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Queue token not found';
  end if;

  if v_user.role = 'barber' and v_token.barber_id <> v_actor_barber_id then
    raise exception 'Barber can only complete assigned queue tokens';
  end if;

  v_before := to_jsonb(v_token);

  update public.queue_tokens
  set status = 'completed'
  where id = p_queue_token_id
  returning * into v_token;

  perform public.record_audit_event(
    v_user_id,
    case when v_user.role = 'admin' then 'admin' else 'barber' end,
    'queue_token',
    v_token.id,
    'completed',
    v_before,
    to_jsonb(v_token)
  );

  perform public.enqueue_notification(
    'queue.completed',
    'queue_token',
    v_token.id,
    v_token.user_id,
    jsonb_build_object('queue_token_id', v_token.id)
  );

  v_response := jsonb_build_object(
    'status_code', 200,
    'body', jsonb_build_object(
      'queue_token', to_jsonb(v_token),
      'replayed', false
    )
  );

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    update public.idempotency_keys
    set response_body = v_response
    where user_id = v_user_id and scope = 'queue.complete' and key = p_idempotency_key;
  end if;

  return v_response;
end;
$$;

create or replace view public.analytics_bookings_daily as
select
  (timezone((select timezone from public.shop_settings where id = 1), a.start_time))::date as bucket_date,
  count(*) filter (where a.status = 'booked') as booked_count,
  count(*) filter (where a.status = 'completed') as completed_count,
  count(*) filter (where a.status = 'cancelled') as cancelled_count,
  sum(a.service_total) filter (where a.payment_status = 'paid') as paid_revenue
from public.appointments a
where a.deleted_at is null
group by 1;

create or replace view public.analytics_queue_daily as
select
  q.queue_date as bucket_date,
  count(*) filter (where q.status = 'waiting') as waiting_count,
  count(*) filter (where q.status = 'assigned') as assigned_count,
  count(*) filter (where q.status = 'completed') as completed_count,
  avg(q.position)::numeric(10, 2) as avg_position
from public.queue_tokens q
where q.deleted_at is null
group by 1;

create or replace view public.analytics_barber_utilization as
select
  b.id as barber_id,
  date_trunc('day', timezone((select timezone from public.shop_settings where id = 1), a.start_time)) as bucket_start,
  sum(a.duration_minutes + a.buffer_before_minutes + a.buffer_after_minutes + a.delay_minutes) as occupied_minutes,
  count(a.id) as appointment_count
from public.barbers b
left join public.appointments a
  on a.barber_id = b.id
 and a.deleted_at is null
 and a.status <> 'cancelled'
where b.deleted_at is null
group by b.id, 2;

alter table public.users enable row level security;
alter table public.appointments enable row level security;
alter table public.queue_tokens enable row level security;
alter table public.invites enable row level security;

create policy "users_self_read" on public.users
for select
using (auth.uid() = id or public.is_admin());

create policy "appointments_customer_read_own" on public.appointments
for select
using (
  public.is_admin()
  or user_id = auth.uid()
  or barber_id = public.current_barber_id()
);

create policy "queue_customer_read_own" on public.queue_tokens
for select
using (
  public.is_admin()
  or user_id = auth.uid()
  or barber_id = public.current_barber_id()
);

create policy "invite_staff_manage" on public.invites
for select
using (public.current_user_role() in ('admin', 'barber'));

insert into public.shop_settings (id)
values (1)
on conflict (id) do nothing;
