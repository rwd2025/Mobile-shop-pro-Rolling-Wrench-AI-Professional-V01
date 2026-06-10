-- PHASE 14 MASTER JOB ENGINE
-- Safe RPC: works even when some tables/columns are missing.
-- Run this in Supabase SQL Editor.

create or replace function public.master_job_workflow(
  search_text text,
  vin_text text default null
)
returns jsonb
language plpgsql
as $$
declare
  q text := trim(coalesce(search_text,''));
  v_parts jsonb := '[]'::jsonb;
  v_labor jsonb := '[]'::jsonb;
  v_kits jsonb := '[]'::jsonb;
  v_torque jsonb := '[]'::jsonb;
  v_failures jsonb := '[]'::jsonb;
  v_tests jsonb := '[]'::jsonb;
  v_suppliers jsonb := '[]'::jsonb;
  v_memory jsonb := '[]'::jsonb;
  where_sql text;
  c text;
  cols text[];
  v_table text;
begin
  -- parts
  v_table := 'parts';
  cols := array['part_id','part_number','oem_part_number','description','engine','engine_family','category','brand','manufacturer'];
  where_sql := '';
  if to_regclass('public.' || v_table) is not null and q <> '' then
    foreach c in array cols loop
      if exists(select 1 from information_schema.columns where table_schema='public' and table_name=v_table and column_name=c) then
        where_sql := where_sql || case when where_sql='' then '' else ' or ' end || format('%I::text ilike %L', c, '%' || q || '%');
      end if;
    end loop;
    if where_sql <> '' then
      execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from public.%I where %s limit 25) t', v_table, where_sql) into v_parts;
    end if;
  end if;

  -- labor_times
  v_table := 'labor_times';
  cols := array['component_name','engine_family','labor_operation','notes','difficulty'];
  where_sql := '';
  if to_regclass('public.' || v_table) is not null and q <> '' then
    foreach c in array cols loop
      if exists(select 1 from information_schema.columns where table_schema='public' and table_name=v_table and column_name=c) then
        where_sql := where_sql || case when where_sql='' then '' else ' or ' end || format('%I::text ilike %L', c, '%' || q || '%');
      end if;
    end loop;
    if where_sql <> '' then
      execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from public.%I where %s limit 25) t', v_table, where_sql) into v_labor;
    end if;
  end if;

  -- repair_kits
  v_table := 'repair_kits';
  cols := array['component_name','engine_family','oem_part_number','gasket_set','seals','o_rings','hardware','repair_notes'];
  where_sql := '';
  if to_regclass('public.' || v_table) is not null and q <> '' then
    foreach c in array cols loop
      if exists(select 1 from information_schema.columns where table_schema='public' and table_name=v_table and column_name=c) then
        where_sql := where_sql || case when where_sql='' then '' else ' or ' end || format('%I::text ilike %L', c, '%' || q || '%');
      end if;
    end loop;
    if where_sql <> '' then
      execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from public.%I where %s limit 25) t', v_table, where_sql) into v_kits;
    end if;
  end if;

  -- torque_specs
  v_table := 'torque_specs';
  cols := array['engine_family','component_name','fastener','torque_value','sequence_notes'];
  where_sql := '';
  if to_regclass('public.' || v_table) is not null and q <> '' then
    foreach c in array cols loop
      if exists(select 1 from information_schema.columns where table_schema='public' and table_name=v_table and column_name=c) then
        where_sql := where_sql || case when where_sql='' then '' else ' or ' end || format('%I::text ilike %L', c, '%' || q || '%');
      end if;
    end loop;
    if where_sql <> '' then
      execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from public.%I where %s limit 25) t', v_table, where_sql) into v_torque;
    end if;
  end if;

  -- common_failures
  v_table := 'common_failures';
  cols := array['fault_code','symptom','engine_family','likely_causes','common_fix','tech_notes'];
  where_sql := '';
  if to_regclass('public.' || v_table) is not null and q <> '' then
    foreach c in array cols loop
      if exists(select 1 from information_schema.columns where table_schema='public' and table_name=v_table and column_name=c) then
        where_sql := where_sql || case when where_sql='' then '' else ' or ' end || format('%I::text ilike %L', c, '%' || q || '%');
      end if;
    end loop;
    if where_sql <> '' then
      execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from public.%I where %s limit 25) t', v_table, where_sql) into v_failures;
    end if;
  end if;

  -- diagnostic_tests
  v_table := 'diagnostic_tests';
  cols := array['engine_family','fault_code','symptom','test_name','test_steps','pass_fail_specs','next_step_if_failed','notes'];
  where_sql := '';
  if to_regclass('public.' || v_table) is not null and q <> '' then
    foreach c in array cols loop
      if exists(select 1 from information_schema.columns where table_schema='public' and table_name=v_table and column_name=c) then
        where_sql := where_sql || case when where_sql='' then '' else ' or ' end || format('%I::text ilike %L', c, '%' || q || '%');
      end if;
    end loop;
    if where_sql <> '' then
      execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from public.%I where %s limit 25) t', v_table, where_sql) into v_tests;
    end if;
  end if;

  -- supplier pricing/links: support either table name
  v_table := case when to_regclass('public.supplier_pricing') is not null then 'supplier_pricing' else 'supplier_links' end;
  cols := array['part_number','supplier_name','brand','description','notes','search_url'];
  where_sql := '';
  if to_regclass('public.' || v_table) is not null and q <> '' then
    foreach c in array cols loop
      if exists(select 1 from information_schema.columns where table_schema='public' and table_name=v_table and column_name=c) then
        where_sql := where_sql || case when where_sql='' then '' else ' or ' end || format('%I::text ilike %L', c, '%' || q || '%');
      end if;
    end loop;
    if where_sql <> '' then
      execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from public.%I where %s limit 25) t', v_table, where_sql) into v_suppliers;
    end if;
  end if;

  -- repair_memory or repair_notes
  v_table := case when to_regclass('public.repair_memory') is not null then 'repair_memory' else 'repair_notes' end;
  cols := array['fault_code','symptom_text','symptom','repair_action','notes','vin'];
  where_sql := '';
  if to_regclass('public.' || v_table) is not null and q <> '' then
    foreach c in array cols loop
      if exists(select 1 from information_schema.columns where table_schema='public' and table_name=v_table and column_name=c) then
        where_sql := where_sql || case when where_sql='' then '' else ' or ' end || format('%I::text ilike %L', c, '%' || q || '%');
      end if;
    end loop;
    if vin_text is not null and vin_text <> '' and exists(select 1 from information_schema.columns where table_schema='public' and table_name=v_table and column_name='vin') then
      if where_sql = '' then
        where_sql := 'vin::text ilike ' || quote_literal('%' || vin_text || '%');
      else
        where_sql := '(' || where_sql || ') or vin::text ilike ' || quote_literal('%' || vin_text || '%');
      end if;
    end if;
    if where_sql <> '' then
      execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from public.%I where %s limit 25) t', v_table, where_sql) into v_memory;
    end if;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'phase', '14_master_job_engine',
    'search_text', q,
    'vin_text', vin_text,
    'identified_repair', jsonb_build_object('job', q, 'confidence', case when jsonb_array_length(v_labor) > 0 or jsonb_array_length(v_kits) > 0 or jsonb_array_length(v_parts) > 0 then 'database_match' else 'needs_more_data' end),
    'parts', v_parts,
    'labor_guide', v_labor,
    'repair_kit', v_kits,
    'torque_specs', v_torque,
    'known_failures', v_failures,
    'diagnostic_flow', v_tests,
    'supplier_pricing', v_suppliers,
    'repair_memory', v_memory,
    'quote', jsonb_build_object('labor_hours', (select coalesce(sum((x->>'labor_hours')::numeric),0) from jsonb_array_elements(v_labor) x where (x->>'labor_hours') ~ '^[0-9]+(\.[0-9]+)?$'))
  );
end;
$$;

-- Test after creating function:
-- select public.master_job_workflow('X15 water pump', null);
