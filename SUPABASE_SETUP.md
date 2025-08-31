# Supabase Setup Guide

This guide will help you connect your API Manager dashboard to a real Supabase database.

## 🚀 Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `api-manager` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
5. Click "Create new project"

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

### 3. Set Up Environment Variables

1. Create a `.env.local` file in your project root:
```bash
# Copy env.example to .env.local
cp env.example .env.local
```

2. Edit `.env.local` and replace the placeholder values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-setup.sql`
3. Paste and run the SQL script
4. This will create the `api_keys` table with proper structure

### 5. Test the Connection

1. Start your development server:
```bash
npm run dev
```

2. Visit `http://localhost:3000/dashboard`
3. You should see the dashboard with real data from Supabase

## 📊 Database Schema

The `api_keys` table has the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `name` | VARCHAR(255) | API key name |
| `key` | VARCHAR(255) | Generated API key |
| `description` | TEXT | Optional description |
| `key_type` | VARCHAR(50) | 'development' or 'production' |
| `monthly_limit` | INTEGER | Monthly usage limit |
| `usage` | INTEGER | Current usage count |
| `status` | VARCHAR(50) | 'active' or 'inactive' |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `last_used` | TIMESTAMP | Last usage timestamp |

## 🔧 Features

### ✅ What's Working

- **Create API Keys**: Generate new API keys with custom names and types
- **Read API Keys**: Display all API keys in a table format
- **Update API Keys**: Edit existing API key details
- **Delete API Keys**: Remove API keys with confirmation
- **Real-time Data**: All changes are immediately saved to Supabase
- **Error Handling**: Proper error messages and retry functionality
- **Loading States**: Loading indicators during database operations

### 🎯 Key Features

- **Automatic Key Generation**: Secure API keys are generated automatically
- **Usage Tracking**: Track API usage for each key
- **Type Management**: Distinguish between development and production keys
- **Monthly Limits**: Set and manage usage limits
- **Status Management**: Active/inactive status tracking

## 🔒 Security Considerations

1. **Row Level Security**: RLS is enabled on the table
2. **Environment Variables**: Never commit your `.env.local` file
3. **API Key Generation**: Keys are generated securely
4. **Input Validation**: All inputs are validated before saving

## 🚨 Troubleshooting

### Common Issues

1. **"Failed to fetch API keys"**
   - Check your environment variables
   - Verify your Supabase project is active
   - Check the browser console for detailed errors

2. **"Failed to create API key"**
   - Ensure the database table exists
   - Check RLS policies
   - Verify your anon key has proper permissions

3. **Connection Issues**
   - Check your internet connection
   - Verify Supabase project URL is correct
   - Ensure your project is not paused

### Debug Mode

To see detailed error messages, check the browser console (F12) for any error logs.

## 📈 Next Steps

1. **Add Authentication**: Implement user authentication with Supabase Auth
2. **Add Rate Limiting**: Implement API rate limiting based on key types
3. **Add Analytics**: Track API usage patterns and analytics
4. **Add Notifications**: Email notifications for usage limits
5. **Add API Documentation**: Generate API documentation automatically

## 🆘 Support

If you encounter any issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the error messages in the browser console
3. Verify your environment variables are correct
4. Ensure your database table is properly set up

---

**Happy coding! 🎉**

