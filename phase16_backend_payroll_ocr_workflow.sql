
-- Rolling Cecil Phase 16 Backend Additions
-- Employee time clock, pause/resume payroll records, OCR/VIN/supplier/workflow safety tables.

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  employee_id text unique,
  full_name text not null,
  role text,
  hourly_rate numeric default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists employee_time_clock (
  id uuid primary key default gen_random_uuid(),
  employee_id text,
  employee_name text,
  vin text,
  job_id uuid,
  clock_in timestamptz,
  clock_out timestamptz,
  pause_start timestamptz,
  total_pause_minutes numeric default 0,
  billable_hours numeric default 0,
  hourly_rate numeric default 0,
  status text default 'clocked_out',
  notes text,
  created_at timestamptz default now()
);

create table if not exists payroll_periods (
  id uuid primary key default gen_random_uuid(),
  period_start date,
  period_end date,
  status text default 'open',
  notes text,
  created_at timestamptz default now()
);

insert into employees (employee_id, full_name, role, hourly_rate)
values
('JAMES', 'James', 'Owner / Technician', 0),
('DAVID', 'David', 'Mobile Repair Specialist', 0),
('STEPH', 'Stephani', 'Operations Manager', 0)
on conflict (employee_id) do nothing;

create table if not exists part_scan_sessions (
  id uuid primary key default gen_random_uuid(),
  vin text,
  scan_type text,
  raw_text text,
  cleaned_text text,
  image_note text,
  created_at timestamptz default now()
);

create table if not exists scanned_part_numbers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references part_scan_sessions(id) on delete cascade,
  part_number text,
  confidence numeric default 0.75,
  status text default 'found',
  supplier text,
  price numeric,
  qty numeric default 1,
  notes text,
  created_at timestamptz default now()
);

create table if not exists invoice_parts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid,
  vin text,
  part_number text,
  part_name text,
  supplier text,
  qty numeric default 1,
  unit_price numeric default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists supplier_locations (
  id uuid primary key default gen_random_uuid(),
  supplier_name text,
  address text,
  city text,
  state text,
  phone text,
  website text,
  search_url text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists vin_scan_queue (
  id uuid primary key default gen_random_uuid(),
  raw_text text,
  extracted_vin text,
  status text default 'found',
  confidence numeric default 0.85,
  created_at timestamptz default now()
);

create table if not exists active_truck_profiles (
  id uuid primary key default gen_random_uuid(),
  vin text,
  year text,
  make text,
  model text,
  engine text,
  unit_number text,
  customer_name text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists truck_repair_memory (
  id uuid primary key default gen_random_uuid(),
  vin text,
  year text,
  make text,
  model text,
  engine text,
  symptom text,
  fault_code text,
  confirmed_fix text,
  parts_used json default '[]'::json,
  labor_hours numeric,
  notes text,
  created_at timestamptz default now()
);

create or replace function payroll_summary(
  start_date date default null,
  end_date date default null
)
returns json
language plpgsql
as $$
declare
  v_rows json;
begin
  select coalesce(json_agg(x), '[]'::json)
  into v_rows
  from (
    select
      employee_id,
      employee_name,
      sum(coalesce(billable_hours,0)) as total_hours,
      sum(coalesce(billable_hours,0) * coalesce(hourly_rate,0)) as gross_pay
    from employee_time_clock
    where (start_date is null or clock_in::date >= start_date)
      and (end_date is null or clock_in::date <= end_date)
    group by employee_id, employee_name
    order by employee_name
  ) x;
  return json_build_object('status','ok','rows',v_rows);
end;
$$;

create or replace function extract_part_numbers_from_text(
  input_text text,
  vin_text text default null,
  scan_type_text text default 'parts_photo'
)
returns json
language plpgsql
as $$
declare
  v_session_id uuid;
  v_clean text;
  v_matches text[];
begin
  v_clean := upper(coalesce(input_text, ''));
  insert into part_scan_sessions (vin, scan_type, raw_text, cleaned_text)
  values (vin_text, scan_type_text, input_text, v_clean)
  returning id into v_session_id;
  select array_agg(distinct m[1])
  into v_matches
  from regexp_matches(v_clean, '\m[A-Z0-9][A-Z0-9\-\.\/]{3,24}\M', 'g') as m
  where m[1] ~ '[0-9]'
    and m[1] not in ('PART','NUMBER','MODEL','SERIAL','FILTER','ENGINE','DIESEL','WARNING','CAUTION','MADE','DATE','CODE','TYPE','QTY');
  insert into scanned_part_numbers (session_id, part_number, confidence, status)
  select v_session_id, x, 0.75, 'found'
  from unnest(coalesce(v_matches, array[]::text[])) as x;
  return json_build_object('status','ok','session_id',v_session_id,'vin',vin_text,'scan_type',scan_type_text,'part_numbers',coalesce(v_matches,array[]::text[]));
end;
$$;

create or replace function extract_vin_from_text(input_text text)
returns json
language plpgsql
as $$
declare
  v_clean text;
  v_vin text;
  v_id uuid;
begin
  v_clean := upper(coalesce(input_text, ''));
  select m[1] into v_vin
  from regexp_matches(v_clean, '\m[A-HJ-NPR-Z0-9]{17}\M', 'g') as m
  limit 1;
  insert into vin_scan_queue (raw_text, extracted_vin, status, confidence)
  values (input_text, v_vin, case when v_vin is null then 'no_vin_found' else 'found' end, case when v_vin is null then 0 else 0.85 end)
  returning id into v_id;
  return json_build_object('status', case when v_vin is null then 'no_vin_found' else 'ok' end,'scan_id',v_id,'vin',v_vin);
end;
$$;

create or replace function add_scanned_parts_to_invoice(session_uuid uuid, vin_text text default null)
returns json
language plpgsql
as $$
declare inserted_count int;
begin
  insert into invoice_parts (vin, part_number, part_name, supplier, qty, unit_price, notes)
  select vin_text, spn.part_number, spn.part_number, spn.supplier, coalesce(spn.qty,1), coalesce(spn.price,0), 'Added from OCR scan session ' || session_uuid
  from scanned_part_numbers spn
  where spn.session_id = session_uuid and spn.status = 'found';
  get diagnostics inserted_count = row_count;
  return json_build_object('status','ok','session_id',session_uuid,'inserted',inserted_count);
end;
$$;

create or replace function find_part_suppliers(search_text text)
returns json
language plpgsql
as $$
declare v_parts json; v_suppliers json;
begin
  select coalesce(json_agg(p), '[]'::json) into v_parts
  from parts p
  where p.part_id ilike '%' || search_text || '%' or p.description ilike '%' || search_text || '%';
  select coalesce(json_agg(s), '[]'::json) into v_suppliers from supplier_locations s;
  return json_build_object('status','ok','search',search_text,'parts',v_parts,'suppliers',v_suppliers);
end;
$$;
