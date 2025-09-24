-- Simplified temporary_messages table - insertion-based system
DROP TABLE IF EXISTS temporary_messages CASCADE;

CREATE TABLE temporary_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zones INTEGER[] NOT NULL, -- Array of zone IDs (e.g., {1,3,4})
  message TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0), -- Duration in seconds
  animation TEXT DEFAULT 'fade' CHECK (animation IN ('fade', 'slide', 'scroll', 'none')),
  
  -- Ensure zones array contains valid zone IDs (1-4)
  CONSTRAINT valid_zones CHECK (
    array_length(zones, 1) > 0 AND
    zones <@ ARRAY[1,2,3,4]  -- Ensures all elements are within 1-4
  )
);

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

-- Enable real-time
ALTER TABLE temporary_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE temporary_messages;

-- Example usage:
-- INSERT INTO temporary_messages (zones, message, duration, animation)
-- VALUES ('{1,3,4}', 'Emergency Exit', 15, 'scroll');