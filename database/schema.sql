-- Create participants table
create table if not exists participants (
  id uuid default gen_random_uuid() primary key,
  participant_code text not null unique,
  participant_group text,
  dominant_arm text,
  created_at timestamptz default now()
);

-- Create sessions table
create table if not exists sessions (
  id uuid default gen_random_uuid() primary key,
  participant_id uuid not null references participants(id) on delete cascade,
  session_type text,
  started_at timestamptz not null,
  completed boolean default false,
  drag_completed boolean default false,
  tap_completed boolean default false,
  hold_completed boolean default false,
  completed_at timestamptz,
  device_info jsonb,
  notes text
);

create index if not exists sessions_participant_id_idx
on sessions (participant_id);

-- Create trial_results table
create table if not exists trial_results (
  id uuid default gen_random_uuid() primary key,

  -- identity & session linkage
  participant_id uuid not null references participants(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  task_type text not null,
  trial_number int not null,
  timestamp timestamptz not null,

  -- trial timing
  trial_start_time timestamptz,
  trial_end_time timestamptz,
  initiation_delay_ms float,
  movement_time_ms float,

  -- task geometry (coordinates in page pixels)
  start_x numeric,
  start_y numeric,
  start_radius numeric,
  target_x numeric,
  target_y numeric,
  target_radius numeric,

  -- device context
  viewport_width int,
  viewport_height int,
  device_pixel_ratio float, 

  -- drag task data
  trajectory jsonb,

  -- tap task data
  taps jsonb,
  total_taps int,
  total_tap_time_ms float,

  -- hold task data
  hold_events jsonb,
  total_hold_time_ms float,
  release_delay_ms float,
  released_early boolean,
  hold_target_duration_ms float,
  akinetic_delay_hold_ms float
);

create index if not exists trial_results_participant_id_idx
on trial_results (participant_id);

create index if not exists trial_results_session_id_idx
on trial_results (session_id);

create index if not exists trial_results_task_type_idx
on trial_results (task_type);


