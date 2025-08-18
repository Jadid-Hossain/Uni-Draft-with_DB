-- Update users table to support user management functionality
-- Add status column if it doesn't exist

ALTER TABLE users
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'suspended'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);

-- Update existing users to have 'approved' status if they don't have a status
UPDATE users 
SET status = 'approved' 
WHERE status IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN users.status IS 'User account status: pending, approved, or suspended';

-- Example of user status values:
-- 'pending' - Newly registered user awaiting admin approval
-- 'approved' - User has been approved and can access the system
-- 'suspended' - User account has been suspended by admin
