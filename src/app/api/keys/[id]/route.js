import { withAuth } from '../../middleware/auth';
import { supabase } from '../../../../lib/supabase';
import { validateUserLimits, getMaxAllowedLimits } from '../../../../lib/rateLimit';

const handleGet = async (req, res) => {
  try {
    const { id } = req.query;

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
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Transform the data to match frontend expectations
    const transformedKey = {
      id: data.id,
      name: data.name,
      key: data.key,
      maskedKey: `${data.key.substring(0, 8)}***************************`,
      description: data.description || '',
      permissions: data.permissions || [],
      createdAt: new Date(data.created_at).toISOString().split('T')[0],
      lastUsed: data.last_used ? new Date(data.last_used).toISOString().split('T')[0] : '-',
      status: data.status || 'active',
      type: data.key_type === 'development' ? 'dev' : 'prod',
      usage: {
        current: {
          minute: data.usage_current_minute || 0,
          hour: data.usage_current_hour || 0,
          day: data.usage_current_day || 0,
          month: data.usage_current_month || 0
        },
        builtin: {
          minute: data.builtin_minute_limit || 1,
          hour: data.builtin_hourly_limit || 10,
          day: data.builtin_daily_limit || 100,
          month: data.builtin_monthly_limit || 1000
        },
        user: {
          minute: data.user_minute_limit,
          hour: data.user_hourly_limit,
          day: data.user_daily_limit,
          month: data.user_monthly_limit
        }
      }
    };

    return res.status(200).json(transformedKey);
  } catch (error) {
    console.error('Error fetching API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const handlePut = async (req, res) => {
  try {
    const { id } = req.query;
    const { 
      name, 
      keyType, 
      description, 
      permissions, 
      status,
      userMonthlyLimit,
      userDailyLimit,
      userHourlyLimit,
      userMinuteLimit
    } = req.body;

    if (!name || !keyType) {
      return res.status(400).json({ error: 'Name and key type are required' });
    }

    // Validate user limits against built-in limits
    const userLimits = {
      minute: userMinuteLimit,
      hour: userHourlyLimit,
      day: userDailyLimit,
      month: userMonthlyLimit
    };

    const validation = validateUserLimits(keyType, userLimits);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid user limits', 
        details: validation.errors,
        maxAllowed: getMaxAllowedLimits(keyType),
        message: 'Please ensure all limits are within the maximum allowed values'
      });
    }

    const updateData = {
      name,
      key_type: keyType,
      description: description || '',
      permissions: permissions || [],
      status: status || 'active',
      user_monthly_limit: userMonthlyLimit,
      user_daily_limit: userDailyLimit,
      user_hourly_limit: userHourlyLimit,
      user_minute_limit: userMinuteLimit,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'API key not found or unauthorized' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const handleDelete = async (req, res) => {
  try {
    const { id } = req.query;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      console.error('Error deleting API key:', error);
      return res.status(404).json({ error: 'API key not found or unauthorized' });
    }

    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'PUT':
      return handlePut(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default withAuth(handler);

