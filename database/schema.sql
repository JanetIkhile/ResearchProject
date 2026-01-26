-- Create participants table
create table if not exists participants (
  id uuid primary key references auth.users(id),
  display_name text not null,
  created_at timestamptz default now()
);

-- Ensure usernames are unique
create unique index if not exists participants_display_name_unique
on participants (display_name);

-- Create sessions table
create table if not exists sessions (
  id uuid primary key,
  participant_id uuid not null references auth.users(id),
  started_at timestamptz not null,
  ended_at timestamptz
);

create index if not exists sessions_participant_id_idx
on sessions (participant_id);

-- Create trial_results table
create table if not exists trial_results (
  id uuid default gen_random_uuid() primary key,

  -- -------- identity --------
  participant_id uuid not null references auth.users(id),
  session_id uuid not null references sessions(id),
  task_type text not null,
  trial_number int not null,
  timestamp timestamptz not null,

  -- -------- device / context --------
  viewport_width int,
  viewport_height int,
  device_pixel_ratio float,

  -- -------- motor measures --------
  akinetic_delay_ms float,
  total_time_ms float,
  total_distance_px float,
  straight_line_distance_px float,
  shortest_path_distance_px float,

  path_efficiency float,
  amplitude_ratio float,

  mean_speed_px_per_ms float,
  peak_speed_px_per_ms float,
  time_to_peak_speed_ms float,

  arrhythmicity_cv float,
  pause_count int,
  mean_pause_duration_ms float,
  pause_ratio float,

  sequence_effect_amplitude float,
  sequence_effect_speed float,

  -- -------- raw trajectory --------
  trajectory jsonb
);

create index if not exists trial_results_participant_id_idx
on trial_results (participant_id);

create index if not exists trial_results_session_id_idx
on trial_results (session_id);

create index if not exists trial_results_task_type_idx
on trial_results (task_type);

-- for pilot
-- alter table participants disable row level security;
-- alter table sessions disable row level security;
-- alter table trial_results disable row level security;

--for tap task
alter table trial_results
add column if not exists total_taps int,
add column if not exists taps_per_second float;

--for hold task
alter table trial_results
add column if not exists total_hold_time_ms float,
add column if not exists release_delay_ms float,
add column if not exists released_early boolean,
add column if not exists hold_target_duration_ms float;

