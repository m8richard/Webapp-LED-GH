-- Create the temporary_messages table
CREATE TABLE temporary_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  zone INTEGER[] NOT NULL,
  animation_type TEXT NOT NULL CHECK (animation_type IN ('fade', 'slide', 'drop')),
  duration INTEGER NOT NULL CHECK (duration > 0), -- Duration in milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE temporary_messages ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (since this is for LED display purposes)
-- In production, you might want to restrict this further
CREATE POLICY "Allow all operations on temporary_messages" ON temporary_messages
  FOR ALL USING (true);

-- Create an index on created_at for efficient querying of recent messages
CREATE INDEX idx_temporary_messages_created_at ON temporary_messages (created_at DESC);

-- Create an index on zone for efficient filtering by zone
CREATE INDEX idx_temporary_messages_zone ON temporary_messages USING GIN (zone);