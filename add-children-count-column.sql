-- Add children_count column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS children_count TEXT DEFAULT '1';

-- Add subscription_cancelled_at column to track cancellation date
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.children_count IS 'Number of children involved in custody case (1, 2, 3, 4, 5, 6+)';
COMMENT ON COLUMN user_profiles.subscription_cancelled_at IS 'Timestamp when subscription was cancelled';

-- Update existing records to have a default value
UPDATE user_profiles 
SET children_count = '1' 
WHERE children_count IS NULL; 