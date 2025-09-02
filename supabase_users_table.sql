-- Create users table for storing user information
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    image_url TEXT,
    provider VARCHAR(50) DEFAULT 'google',
    provider_id VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on provider_id for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- Create policy to allow service role to manage all users (for NextAuth)
CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy to allow authenticated users to read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
