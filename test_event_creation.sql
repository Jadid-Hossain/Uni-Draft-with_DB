-- Test script to verify event creation works after fixing the enum
-- Run this after executing fix_events_status_enum.sql

-- Test 1: Check current enum values
SELECT 'Current enum values:' as test;
SELECT unnest(enum_range(NULL::event_status)) as status_values;

-- Test 2: Try to insert an event with 'upcoming' status
SELECT 'Testing event creation with upcoming status:' as test;
INSERT INTO events (
    title, 
    description, 
    start_at, 
    end_at, 
    location, 
    capacity, 
    status, 
    created_by,
    created_at,
    updated_at
) VALUES (
    'Test Event - Upcoming',
    'This is a test event to verify the enum fix works',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
    'Test Location',
    50,
    'upcoming',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
) RETURNING id, title, status;

-- Test 3: Try to insert an event with 'ongoing' status
SELECT 'Testing event creation with ongoing status:' as test;
INSERT INTO events (
    title, 
    description, 
    start_at, 
    end_at, 
    location, 
    capacity, 
    status, 
    created_by,
    created_at,
    updated_at
) VALUES (
    'Test Event - Ongoing',
    'This is a test event to verify the enum fix works',
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '1 hour',
    'Test Location',
    50,
    'ongoing',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
) RETURNING id, title, status;

-- Test 4: Check all events to verify they were created
SELECT 'All events in the system:' as test;
SELECT id, title, status, created_at FROM events ORDER BY created_at DESC LIMIT 5;

-- Clean up test data (optional)
-- DELETE FROM events WHERE title LIKE 'Test Event%';
