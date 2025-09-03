import { supabase } from './supabase'
import { validateUserLimits } from './rateLimit'

// Create a new API key
export async function createApiKey(apiKeyData) {
  try {
    // Validate user limits against built-in limits
    const userLimits = {
      minute: apiKeyData.userMinuteLimit,
      hour: apiKeyData.userHourlyLimit,
      day: apiKeyData.userDailyLimit,
      month: apiKeyData.userMonthlyLimit
    };

    const validation = validateUserLimits(apiKeyData.keyType, userLimits);
    if (!validation.isValid) {
      return { 
        success: false, 
        error: 'Invalid user limits', 
        details: validation.errors 
      };
    }

    const { data, error } = await supabase
      .from('api_keys')
      .insert([
        {
          name: apiKeyData.name,
          key: generateApiKey(),
          key_type: apiKeyData.keyType,
          description: apiKeyData.description || '',
          permissions: apiKeyData.permissions || [],
          user_id: apiKeyData.userId,
          user_monthly_limit: apiKeyData.userMonthlyLimit,
          user_daily_limit: apiKeyData.userDailyLimit,
          user_hourly_limit: apiKeyData.userHourlyLimit,
          user_minute_limit: apiKeyData.userMinuteLimit,
          status: 'active',
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Error creating API key:', error)
    return { success: false, error: error.message }
  }
}

// Get all API keys
export async function getApiKeys() {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select(`
        *,
        usage_current_month,
        usage_current_day,
        usage_current_hour,
        usage_current_minute,
        builtin_monthly_limit,
        builtin_daily_limit,
        builtin_hourly_limit,
        builtin_minute_limit,
        user_monthly_limit,
        user_daily_limit,
        user_hourly_limit,
        user_minute_limit
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return { success: false, error: error.message }
  }
}

// Update an API key
export async function updateApiKey(id, apiKeyData) {
  try {
    // Validate user limits against built-in limits
    const userLimits = {
      minute: apiKeyData.userMinuteLimit,
      hour: apiKeyData.userHourlyLimit,
      day: apiKeyData.userDailyLimit,
      month: apiKeyData.userMonthlyLimit
    };

    const validation = validateUserLimits(apiKeyData.keyType, userLimits);
    if (!validation.isValid) {
      return { 
        success: false, 
        error: 'Invalid user limits', 
        details: validation.errors 
      };
    }

    const { data, error } = await supabase
      .from('api_keys')
      .update({
        name: apiKeyData.name,
        key_type: apiKeyData.keyType,
        description: apiKeyData.description || '',
        permissions: apiKeyData.permissions || [],
        user_monthly_limit: apiKeyData.userMonthlyLimit,
        user_daily_limit: apiKeyData.userDailyLimit,
        user_hourly_limit: apiKeyData.userHourlyLimit,
        user_minute_limit: apiKeyData.userMinuteLimit,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Error updating API key:', error)
    return { success: false, error: error.message }
  }
}

// Delete an API key
export async function deleteApiKey(id) {
  try {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting API key:', error)
    return { success: false, error: error.message }
  }
}

// Get API key usage statistics
export async function getApiKeyUsage(id) {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        name,
        key_type,
        usage_current_month,
        usage_current_day,
        usage_current_hour,
        usage_current_minute,
        builtin_monthly_limit,
        builtin_daily_limit,
        builtin_hourly_limit,
        builtin_minute_limit,
        user_monthly_limit,
        user_daily_limit,
        user_hourly_limit,
        user_minute_limit,
        usage_reset_month,
        usage_reset_day,
        usage_reset_hour,
        usage_reset_minute,
        last_used
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching API key usage:', error)
    return { success: false, error: error.message }
  }
}

// Generate a random API key
function generateApiKey() {
  const prefix = 'tvly'
  const randomPart = Math.random().toString(36).substring(2, 11)
  const suffix = '***************************'
  return `${prefix}-${randomPart}-${suffix}`
}
