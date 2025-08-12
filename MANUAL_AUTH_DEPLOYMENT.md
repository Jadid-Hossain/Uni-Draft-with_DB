# 🔐 Manual Authentication Deployment Guide

## Overview

This guide will help you replace the Supabase built-in authentication system with a manual user management system. This eliminates dependency on Supabase Auth and provides better control over user authentication.

## ⚠️ Important Notice

**BACKUP YOUR DATABASE FIRST!** This migration involves dropping and recreating tables. Make sure you have a complete backup of your data before proceeding.

## 🚀 Step 1: Database Migration

### 1.1 Execute the New Schema

1. Go to your Supabase Dashboard → SQL Editor
2. **Option A:** Execute the complete new schema:
   - Copy and paste the entire contents of `manual_auth_schema.sql`
   - This will create all new tables and functions

3. **Option B:** Gradual migration (recommended for production):
   - First, run only the user-related parts:

```sql
-- Step 1: Create the new users table and functions
-- (Copy from manual_auth_schema.sql lines 1-200)

-- Step 2: Migrate existing data if you have any
-- (You'll need to create custom migration scripts based on your existing data)

-- Step 3: Update foreign keys and drop old tables
-- (Copy from manual_auth_schema.sql lines 201-end)
```

### 1.2 Add Session Context Functions

Make sure these functions are included in your database:

```sql
-- Function to set session context for RLS
create or replace function public.set_session_context(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.current_user_id', user_id::text, true);
end;
$$;

-- Function to clear session context
create or replace function public.clear_session_context()
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.current_user_id', '', true);
end;
$$;
```

### 1.3 Create Initial Admin User (Optional)

```sql
-- Create admin user (replace with your actual credentials)
insert into public.users (email, password_hash, full_name, department, employee_id, role)
values ('admin@g.bracu.ac.bd', public.hash_password('your_secure_password'), 'System Administrator', 'IT Department', 'EMP001', 'admin');
```

## 🔧 Step 2: Frontend Configuration

### 2.1 Install Dependencies (Already Done)

The following files have been updated:
- ✅ `src/lib/auth.ts` - New manual authentication service
- ✅ `src/context/AuthContext.tsx` - Updated to use manual auth
- ✅ `src/lib/supabase.ts` - Disabled auth features
- ✅ `src/pages/SignIn.tsx` - Already compatible
- ✅ `src/pages/SignUp.tsx` - Already compatible

### 2.2 Environment Variables

Your `.env` file should contain:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** You still need these for database operations, just not for authentication.

## 🧪 Step 3: Testing

### 3.1 Test User Registration

1. Go to `/signup`
2. Create a test account:
   - Email: `test@g.bracu.ac.bd`
   - Role: Student
   - Student ID: `STU123456`
   - Department: `Computer Science`
   - Password: Strong password

### 3.2 Test Login

1. Go to `/signin`
2. Login with the test account
3. Verify you're redirected to the dashboard
4. Check browser localStorage for session data

### 3.3 Test Session Persistence

1. Login and navigate around the app
2. Refresh the page
3. Verify you remain logged in
4. Close and reopen browser
5. Verify session is maintained (until expiry)

## 🔒 Step 4: Security Considerations

### 4.1 Password Security

The system uses PostgreSQL's `pgcrypto` extension with bcrypt for password hashing:
- Passwords are hashed with salt factor 8
- Never store plain text passwords
- Passwords are validated server-side

### 4.2 Session Management

- Sessions expire after 7 days (configurable)
- Session tokens are cryptographically secure
- Old sessions are not automatically cleaned up (consider adding a cleanup job)

### 4.3 Row Level Security (RLS)

- All tables have RLS enabled
- Policies use `current_setting('app.current_user_id')` for user context
- Session context is set automatically on login

## 🚨 Step 5: Migration Checklist

### Before Migration:
- [ ] Backup your entire database
- [ ] Test the new schema in a development environment
- [ ] Prepare rollback plan
- [ ] Notify users of potential downtime

### During Migration:
- [ ] Put application in maintenance mode
- [ ] Export existing user data if applicable
- [ ] Execute new schema
- [ ] Migrate existing data
- [ ] Test critical functions
- [ ] Update environment variables if needed

### After Migration:
- [ ] Test user registration
- [ ] Test user login
- [ ] Test session persistence
- [ ] Test all CRUD operations
- [ ] Test role-based permissions
- [ ] Remove maintenance mode
- [ ] Monitor for issues

## 🔧 Step 6: Cleanup Old System

### 6.1 Remove Supabase Auth Dependencies (If Desired)

If you want to completely remove Supabase Auth:

1. Remove unused auth tables and policies
2. Clean up any auth-related triggers
3. Update your Supabase project settings to disable auth

### 6.2 Database Cleanup

Consider running these cleanup commands after successful migration:

```sql
-- Clean up old sessions periodically
DELETE FROM public.user_sessions WHERE expires_at < now();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON public.users(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON public.users(employee_id) WHERE employee_id IS NOT NULL;
```

## 🐛 Troubleshooting

### Common Issues:

1. **"Missing current_user_id context"**
   - Ensure session context functions are created
   - Check that login sets the context properly

2. **"Password verification failed"**
   - Verify pgcrypto extension is enabled
   - Check password hashing function

3. **"RLS policy violations"**
   - Ensure user context is set before database operations
   - Check RLS policies are correctly updated

4. **"Session not persisting"**
   - Check localStorage functionality
   - Verify session token is being saved

### Debug Commands:

```sql
-- Check if user context is set
SELECT current_setting('app.current_user_id', true);

-- Check active sessions
SELECT * FROM public.user_sessions WHERE expires_at > now();

-- Check user table
SELECT id, email, role, is_active FROM public.users;
```

## 📊 Performance Considerations

- Session validation happens on every request
- Consider implementing session caching
- Monitor database performance with the new schema
- Add appropriate database indexes

## 🎯 Benefits of Manual Authentication

✅ **Better Performance:** No dependency on external auth service
✅ **Full Control:** Complete control over user management
✅ **Simplified Architecture:** Fewer external dependencies
✅ **Custom Features:** Easy to add custom user fields and logic
✅ **Cost Effective:** Reduced reliance on Supabase auth pricing

## 🔄 Rollback Plan

If you need to rollback:

1. Restore database from backup
2. Revert frontend code changes
3. Re-enable Supabase auth in project settings
4. Test auth functionality

---

## 🎉 Completion

Once migration is complete, your application will have:
- ✅ Manual user registration and authentication
- ✅ Secure password hashing
- ✅ Session management
- ✅ Role-based access control
- ✅ All existing features working with new auth system

**Next Steps:** Consider adding features like password reset, email verification, and session management UI.
