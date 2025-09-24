-- Create temporary_messages table
CREATE TABLE temporary_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zones INTEGER[] NOT NULL, -- Array of zone IDs (e.g., {1,3,4})
  message TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0), -- Duration in seconds
  animation TEXT DEFAULT 'fade' CHECK (animation IN ('fade', 'slide', 'scroll', 'none')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Ensure expires_at is after created_at
  CONSTRAINT valid_expiry CHECK (expires_at > created_at),
  
  -- Ensure zones array contains valid zone IDs (1-4)
  CONSTRAINT valid_zones CHECK (
  array_length(zones, 1) > 0 AND
  zones <@ ARRAY[1,2,3,4]  -- Ensures all elements are within 1-4
)
);

-- Index for performance on active messages
CREATE INDEX idx_temporary_messages_active 
ON temporary_messages (is_active, expires_at, created_at DESC) 
WHERE is_active = true;

-- Index for zone-specific queries
CREATE INDEX idx_temporary_messages_zones 
ON temporary_messages USING GIN (zones);

-- Enable Row Level Security
ALTER TABLE temporary_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (adjust for your security needs)
CREATE POLICY "Allow all operations on temporary_messages" 
ON temporary_messages FOR ALL 
TO public 
USING (true);

-- Function to automatically mark expired messages as inactive
CREATE OR REPLACE FUNCTION cleanup_expired_temporary_messages()
RETURNS void AS $$
BEGIN
  UPDATE temporary_messages 
  SET is_active = false 
  WHERE is_active = true 
    AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup expired messages on each insert
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_temporary_messages()
RETURNS trigger AS $$
BEGIN
  PERFORM cleanup_expired_temporary_messages();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_temporary_messages_trigger
  AFTER INSERT ON temporary_messages
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_expired_temporary_messages();

-- Example usage:
-- INSERT INTO temporary_messages (zones, message, duration, animation, expires_at)
-- VALUES ('{1,3,4}', 'Emergency Exit', 15, 'scroll', NOW() + INTERVAL '15 seconds');