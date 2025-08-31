-- Create the api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) NOT NULL UNIQUE,
    key_type VARCHAR(50) NOT NULL DEFAULT 'development',
    monthly_limit INTEGER,
    usage INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE
);

-- Create an index on the key column for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- Create an index on the name column for faster searches
CREATE INDEX IF NOT EXISTS idx_api_keys_name ON api_keys(name);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can modify this based on your needs)
CREATE POLICY "Allow all operations on api_keys" ON api_keys
    FOR ALL USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON api_keys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a sample API key for testing
INSERT INTO api_keys (name, key, key_type, usage, status) 
VALUES (
    'default',
    'tvly-dev-abc123def-***************************',
    'development',
    0,
    'active'
) ON CONFLICT (key) DO NOTHING;
