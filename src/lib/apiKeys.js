import { supabase } from './supabase'

// Create a new API key
export async function createApiKey(apiKeyData) {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .insert([
        {
          name: apiKeyData.name,
          key: generateApiKey(),
          key_type: apiKeyData.keyType,
          monthly_limit: apiKeyData.monthlyLimit ? apiKeyData.limitValue : null,
          usage: 0,
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
      .select('*')
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
    const { data, error } = await supabase
      .from('api_keys')
      .update({
        name: apiKeyData.name,
        key_type: apiKeyData.keyType,
        monthly_limit: apiKeyData.monthlyLimit ? apiKeyData.limitValue : null,
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

// Update API key usage
export async function updateApiKeyUsage(id, usage) {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({
        usage: usage,
        last_used: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating API key usage:', error)
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
