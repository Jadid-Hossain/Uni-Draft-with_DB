-- Fix Student Data Management - Remove Authentication Requirements
-- This makes student data management purely administrative without individual student auth

-- Update RLS policies to only check admin access, not individual student auth
-- Drop existing policies
drop policy if exists "Admins can view all student data" on public.student_data;
drop policy if exists "Admins can insert student data" on public.student_data;
drop policy if exists "Admins can update student data" on public.student_data;
drop policy if exists "Admins can delete student data" on public.student_data;

-- Create new simplified policies that only check admin status
create policy "Admins can manage all student data" on public.student_data 
    for all using (public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin'))
    with check (public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin'));

-- Update create function to be simpler
create or replace function public.create_student_data(
  p_student_id text,
  p_full_name text,
  p_email text,
  p_department text,
  p_blood_group public.blood_group_type default null,
  p_phone_number text default null,
  p_address text default null,
  p_date_of_birth date default null,
  p_admission_date date default current_date,
  p_validity_date date default null,
  p_guardian_name text default null,
  p_guardian_phone text default null,
  p_emergency_contact text default null,
  p_profile_image_url text default null,
  p_notes text default null
)
returns json
language plpgsql
security definer
as $$
declare
  new_student_id uuid;
  current_user_id uuid;
begin
  -- Get current user ID from session context
  current_user_id := current_setting('app.current_user_id', true)::uuid;
  
  -- Basic validation only
  if p_student_id is null or p_full_name is null or p_email is null or p_department is null then
    return json_build_object('success', false, 'error', 'Missing required fields');
  end if;
  
  -- Check if student ID already exists
  if exists (select 1 from public.student_data where student_id = p_student_id) then
    return json_build_object('success', false, 'error', 'Student ID already exists');
  end if;
  
  -- Check if email already exists
  if exists (select 1 from public.student_data where email = p_email) then
    return json_build_object('success', false, 'error', 'Email already exists');
  end if;
  
  -- Insert student data (created_by will be the admin who adds the data)
  insert into public.student_data (
    student_id, full_name, email, department, blood_group,
    phone_number, address, date_of_birth, admission_date, validity_date,
    guardian_name, guardian_phone, emergency_contact, profile_image_url,
    notes, created_by
  ) values (
    p_student_id, p_full_name, p_email, p_department, p_blood_group,
    p_phone_number, p_address, p_date_of_birth, p_admission_date, p_validity_date,
    p_guardian_name, p_guardian_phone, p_emergency_contact, p_profile_image_url,
    p_notes, current_user_id
  ) returning id into new_student_id;
  
  return json_build_object(
    'success', true,
    'student_id', new_student_id,
    'message', 'Student data created successfully'
  );
end;
$$;

-- Update update function
create or replace function public.update_student_data(
  p_id uuid,
  p_student_id text default null,
  p_full_name text default null,
  p_email text default null,
  p_department text default null,
  p_blood_group public.blood_group_type default null,
  p_phone_number text default null,
  p_address text default null,
  p_date_of_birth date default null,
  p_admission_date date default null,
  p_validity_date date default null,
  p_guardian_name text default null,
  p_guardian_phone text default null,
  p_emergency_contact text default null,
  p_status public.student_status default null,
  p_profile_image_url text default null,
  p_notes text default null
)
returns json
language plpgsql
security definer
as $$
declare
  student_record public.student_data%rowtype;
begin
  -- Get existing student record
  select * into student_record from public.student_data where id = p_id;
  
  if not found then
    return json_build_object('success', false, 'error', 'Student not found');
  end if;
  
  -- Check for duplicate student_id if being updated
  if p_student_id is not null and p_student_id != student_record.student_id then
    if exists (select 1 from public.student_data where student_id = p_student_id and id != p_id) then
      return json_build_object('success', false, 'error', 'Student ID already exists');
    end if;
  end if;
  
  -- Check for duplicate email if being updated
  if p_email is not null and p_email != student_record.email then
    if exists (select 1 from public.student_data where email = p_email and id != p_id) then
      return json_build_object('success', false, 'error', 'Email already exists');
    end if;
  end if;
  
  -- Update student data
  update public.student_data set
    student_id = coalesce(p_student_id, student_id),
    full_name = coalesce(p_full_name, full_name),
    email = coalesce(p_email, email),
    department = coalesce(p_department, department),
    blood_group = coalesce(p_blood_group, blood_group),
    phone_number = coalesce(p_phone_number, phone_number),
    address = coalesce(p_address, address),
    date_of_birth = coalesce(p_date_of_birth, date_of_birth),
    admission_date = coalesce(p_admission_date, admission_date),
    validity_date = coalesce(p_validity_date, validity_date),
    guardian_name = coalesce(p_guardian_name, guardian_name),
    guardian_phone = coalesce(p_guardian_phone, guardian_phone),
    emergency_contact = coalesce(p_emergency_contact, emergency_contact),
    status = coalesce(p_status, status),
    profile_image_url = coalesce(p_profile_image_url, profile_image_url),
    notes = coalesce(p_notes, notes),
    updated_at = now()
  where id = p_id;
  
  return json_build_object(
    'success', true,
    'message', 'Student data updated successfully'
  );
end;
$$;

-- Update delete function
create or replace function public.delete_student_data(p_id uuid)
returns json
language plpgsql
security definer
as $$
begin
  -- Check if student exists
  if not exists (select 1 from public.student_data where id = p_id) then
    return json_build_object('success', false, 'error', 'Student not found');
  end if;
  
  -- Delete student data
  delete from public.student_data where id = p_id;
  
  return json_build_object(
    'success', true,
    'message', 'Student data deleted successfully'
  );
end;
$$;

-- Update statistics function
create or replace function public.get_student_statistics()
returns json
language plpgsql
security definer
as $$
declare
  total_students integer;
  active_students integer;
  departments_count integer;
  recent_admissions integer;
begin
  -- Get statistics
  select count(*) into total_students from public.student_data;
  select count(*) into active_students from public.student_data where status = 'active';
  select count(distinct department) into departments_count from public.student_data;
  select count(*) into recent_admissions from public.student_data where admission_date >= current_date - interval '30 days';
  
  return json_build_object(
    'success', true,
    'statistics', json_build_object(
      'total_students', total_students,
      'active_students', active_students,
      'departments_count', departments_count,
      'recent_admissions', recent_admissions
    )
  );
end;
$$;

-- Success message
select 'Student data management simplified - no individual student auth required!' as status;
