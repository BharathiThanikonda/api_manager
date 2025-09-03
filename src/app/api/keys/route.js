import { withAuth } from '../middleware/auth';
import { supabase } from '../../../lib/supabase';
import { validateUserLimits, getMaxAllowedLimits } from '../../../lib/rateLimit';

const handleGet = async (req, res) => {
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
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch API keys' });
    }

    // Transform the data to match frontend expectations
    const transformedKeys = data.map(key => ({
      id: key.id,
      name: key.name,
      key: key.key,
      maskedKey: `${key.key.substring(0, 8)}***************************`,
      description: key.description || '',
      permissions: key.permissions || [],
      createdAt: new Date(key.created_at).toISOString().split('T')[0],
      lastUsed: key.last_used ? new Date(key.last_used).toISOString().split('T')[0] : '-',
      status: key.status || 'active',
      type: key.key_type === 'development' ? 'dev' : 'prod',
      usage: {
        current: {
          minute: key.usage_current_minute || 0,
          hour: key.usage_current_hour || 0,
          day: key.usage_current_day || 0,
          month: key.usage_current_month || 0
        },
        builtin: {
          minute: key.builtin_minute_limit || 1,
          hour: key.builtin_hourly_limit || 10,
          day: key.builtin_daily_limit || 100,
          month: key.builtin_monthly_limit || 1000
        },
        user: {
          minute: key.user_minute_limit,
          hour: key.user_hourly_limit,
          day: key.user_daily_limit,
          month: key.user_monthly_limit
        }
      }
    }));

    return res.status(200).json(transformedKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const handlePost = async (req, res) => {
  try {
    const { 
      name, 
      keyType, 
      description, 
      permissions, 
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

    const newKey = {
      name,
      key: `tvly-${keyType === 'development' ? 'dev' : 'prod'}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      key_type: keyType,
      description: description || '',
      permissions: permissions || [],
      user_monthly_limit: userMonthlyLimit,
      user_daily_limit: userDailyLimit,
      user_hourly_limit: userHourlyLimit,
      user_minute_limit: userMinuteLimit,
      status: 'active',
      user_id: req.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('api_keys')
      .insert([newKey])
      .select()
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return res.status(500).json({ error: 'Failed to create API key' });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default withAuth(handler);

