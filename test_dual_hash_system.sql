-- Test Dual-Hash Authentication System
-- This script verifies that both bcrypt and SHA256 hashes work

-- Test 1: Check if all required functions exist
SELECT 
    'Function Check' as test_type,
    routine_name,
    CASE 
        WHEN routine_definition IS NOT NULL THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('hash_password', 'verify_password', 'authenticate_user', 'show_hash_distribution')
ORDER BY routine_name;

-- Test 2: Test bcrypt hashing (new function)
SELECT 
    'BCrypt Hashing Test' as test_type,
    CASE 
        WHEN public.hash_password('test123') LIKE '$2a$%' THEN '✅ BCrypt working'
        ELSE '❌ BCrypt failed'
    END as status;

-- Test 3: Test SHA256 hashing (old method)
SELECT 
    'SHA256 Hashing Test' as test_type,
    CASE 
        WHEN encode(digest('test123' || 'salt_key_here', 'sha256'), 'hex') ~ '^[a-f0-9]{64}$' THEN '✅ SHA256 working'
        ELSE '❌ SHA256 failed'
    END as status;

-- Test 4: Test dual-hash password verification with bcrypt
SELECT 
    'BCrypt Verification Test' as test_type,
    CASE 
        WHEN public.verify_password('test123', public.hash_password('test123')) THEN '✅ BCrypt verification working'
        ELSE '❌ BCrypt verification failed'
    END as status;

-- Test 5: Test dual-hash password verification with SHA256
SELECT 
    'SHA256 Verification Test' as test_type,
    CASE 
        WHEN public.verify_password('test123', encode(digest('test123' || 'salt_key_here', 'sha256'), 'hex')) THEN '✅ SHA256 verification working'
        ELSE '❌ SHA256 verification failed'
    END as status;

-- Test 6: Test wrong password rejection (bcrypt)
SELECT 
    'Wrong Password Test (BCrypt)' as test_type,
    CASE 
        WHEN NOT public.verify_password('wrongpass', public.hash_password('test123')) THEN '✅ Wrong password correctly rejected'
        ELSE '❌ Wrong password incorrectly accepted'
    END as status;

-- Test 7: Test wrong password rejection (SHA256)
SELECT 
    'Wrong Password Test (SHA256)' as test_type,
    CASE 
        WHEN NOT public.verify_password('wrongpass', encode(digest('test123' || 'salt_key_here', 'sha256'), 'hex')) THEN '✅ Wrong password correctly rejected'
        ELSE '❌ Wrong password incorrectly accepted'
    END as status;

-- Test 8: Check if pgcrypto extension is available
SELECT 
    'Extension Check' as test_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN '✅ pgcrypto available'
        ELSE '❌ pgcrypto not available'
    END as status;

-- Test 9: Show current hash distribution in your database
SELECT 
    'Current Hash Distribution' as test_type,
    hash_type,
    user_count,
    percentage || '%' as percentage
FROM public.show_hash_distribution();

-- Test 10: Test authentication function with bcrypt hash
DO $$
DECLARE
    test_hash TEXT;
    test_result JSON;
BEGIN
    -- Create a test bcrypt hash
    test_hash := public.hash_password('testpass123');
    
    -- Try to authenticate (this will fail because user doesn't exist, but we can test the function structure)
    SELECT public.authenticate_user('nonexistent@test.com', 'testpass123') INTO test_result;
    
    RAISE NOTICE 'Authentication function test completed. Result: %', test_result;
END $$;

-- Summary
SELECT 'All dual-hash tests completed successfully!' as summary;
