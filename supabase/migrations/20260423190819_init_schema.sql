-- Extensions
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- Enums
create type public.user_role as enum ('customer', 'barber', 'admin');
create type public.appointment_status as enum ('booked', 'completed', 'cancelled');
create type public.queue_status as enum ('waiting', 'assigned', 'completed', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'refunded', 'failed');
create type public.payment_mode as enum ('cash', 'card', 'upi', 'wallet', 'unknown');

-- USERS
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'customer',
  name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

-- BARBERS
create table public.barbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

-- SERVICES
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

-- SHOP SETTINGS
create table public.shop_settings (
  id integer primary key default 1 check (id = 1),
  shop_name text not null default 'Selor Barber Shop',
  timezone text not null default 'Asia/Kolkata',
  weekly_hours jsonb not null,
  default_buffer_before_minutes integer not null default 5,
  default_buffer_after_minutes integer not null default 5,
  slot_interval_minutes integer not null default 15,
  reminder_lead_minutes integer[] not null default array[120,30],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- APPOINTMENTS (FINAL FIX)
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  barber_id uuid not null references public.barbers(id),

  start_time timestamptz not null,
  end_time timestamptz not null,

  duration_minutes integer not null check (duration_minutes > 0),

  buffer_before_minutes integer not null default 0,
  buffer_after_minutes integer not null default 0,
  delay_minutes integer not null default 0,
  blocked_time_range tstzrange not null,

  service_total numeric(10,2) not null default 0,

  status public.appointment_status not null default 'booked',
  payment_status public.payment_status not null default 'pending',
  payment_mode public.payment_mode not null default 'unknown',

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,

  constraint appointments_time_order check (end_time > start_time)
);

create or replace function public.set_appointment_blocked_time_range()
returns trigger
language plpgsql
as $$
begin
  new.blocked_time_range := tstzrange(
    new.start_time - (new.buffer_before_minutes * interval '1 minute'),
    new.end_time + (new.buffer_after_minutes * interval '1 minute'),
    '[)'
  );

  return new;
end;
$$;

create trigger appointments_set_blocked_time_range
before insert or update on public.appointments
for each row execute procedure public.set_appointment_blocked_time_range();

-- 🚨 CRITICAL: NO OVERLAPPING BOOKINGS (FINAL FIX)
alter table public.appointments
add constraint appointments_no_overlap
exclude using gist (
  barber_id with =,
  blocked_time_range with &&
)
where (deleted_at is null and status = 'booked');

-- APPOINTMENT SERVICES
create table public.appointment_services (
  appointment_id uuid references public.appointments(id) on delete cascade,
  service_id uuid references public.services(id),
  sort_order integer not null default 0,
  service_name_snapshot text not null,
  duration_minutes_snapshot integer not null,
  price_snapshot numeric(10,2) not null,
  primary key (appointment_id, service_id)
);

-- QUEUE
create table public.queue_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  barber_id uuid references public.barbers(id),
  status public.queue_status not null default 'waiting',
  position integer not null,
  queue_date date not null,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  deleted_at timestamptz
);

-- UNIQUE QUEUE POSITION PER DAY
create unique index queue_unique_position
on public.queue_tokens(queue_date, position)
where deleted_at is null;

-- INDEXES
create index appointments_barber_idx
on public.appointments(barber_id, start_time);

create index queue_lookup_idx
on public.queue_tokens(queue_date, position);

-- UPDATED_AT TRIGGER
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger appointments_updated
before update on public.appointments
for each row execute procedure public.set_updated_at();

create trigger queue_updated
before update on public.queue_tokens
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.users enable row level security;
alter table public.appointments enable row level security;
alter table public.queue_tokens enable row level security;

-- USERS POLICY
create policy users_self
on public.users
for select
using (auth.uid() = id);

-- APPOINTMENTS POLICY
create policy appointments_access
on public.appointments
for select
using (
  user_id = auth.uid()
  or barber_id in (
    select id from public.barbers where user_id = auth.uid()
  )
);

-- QUEUE POLICY
create policy queue_access
on public.queue_tokens
for select
using (
  user_id = auth.uid()
  or barber_id in (
    select id from public.barbers where user_id = auth.uid()
  )
);

-- DEFAULT SETTINGS
insert into public.shop_settings (id, weekly_hours)
values (1, '{}'::jsonb)
on conflict do nothing;
