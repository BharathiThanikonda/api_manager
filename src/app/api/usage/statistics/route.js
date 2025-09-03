import { withAuth } from '../../middleware/auth';
import { supabase } from '../../../../lib/supabase';

const handleGet = async (req, res) => {
  try {
    const { apiKeyId } = req.query;

    if (!apiKeyId) {
      return res.status(400).json({ error: 'API key ID is required' });
    }

    // Verify the API key belongs to the authenticated user
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select(`
        id, name, key_type, 
        usage_current_month, usage_current_day, usage_current_hour, usage_current_minute,
        builtin_monthly_limit, builtin_daily_limit, builtin_hourly_limit, builtin_minute_limit,
        user_monthly_limit, user_daily_limit, user_hourly_limit, user_minute_limit,
        usage_reset_month, usage_reset_day, usage_reset_hour, usage_reset_minute,
        last_used
      `)
      .eq('id', apiKeyId)
      .eq('user_id', req.userId)
      .single();

    if (keyError || !keyData) {
      return res.status(404).json({ error: 'API key not found or unauthorized' });
    }

    const currentUsage = {
      minute: keyData.usage_current_minute || 0,
      hour: keyData.usage_current_hour || 0,
      day: keyData.usage_current_day || 0,
      month: keyData.usage_current_month || 0
    };

    const builtinLimits = {
      minute: keyData.builtin_minute_limit || 1,
      hour: keyData.builtin_hourly_limit || 10,
      day: keyData.builtin_daily_limit || 100,
      month: keyData.builtin_monthly_limit || 1000
    };

    const userLimits = {
      minute: keyData.user_minute_limit,
      hour: keyData.user_hourly_limit,
      day: keyData.user_daily_limit,
      month: keyData.user_monthly_limit
    };

    // Calculate remaining usage for each period
    const remaining = {
      minute: Math.max(0, builtinLimits.minute - currentUsage.minute),
      hour: Math.max(0, builtinLimits.hour - currentUsage.hour),
      day: Math.max(0, builtinLimits.day - currentUsage.day),
      month: Math.max(0, builtinLimits.month - currentUsage.month)
    };

    // Calculate usage percentages
    const usagePercentage = {
      minute: builtinLimits.minute > 0 ? (currentUsage.minute / builtinLimits.minute) * 100 : 0,
      hour: builtinLimits.hour > 0 ? (currentUsage.hour / builtinLimits.hour) * 100 : 0,
      day: builtinLimits.day > 0 ? (currentUsage.day / builtinLimits.day) * 100 : 0,
      month: builtinLimits.month > 0 ? (currentUsage.month / builtinLimits.month) * 100 : 0
    };

    // Determine status based on built-in limits
    const status = remaining.month > 0 ? 'active' : 'limit_exceeded';

    return res.status(200).json({
      api_key: {
        id: keyData.id,
        name: keyData.name,
        type: keyData.key_type
      },
      builtin_limits: builtinLimits,
      user_limits: userLimits,
      usage: {
        current: currentUsage,
        remaining: remaining,
        percentage: {
          minute: Math.round(usagePercentage.minute * 100) / 100,
          hour: Math.round(usagePercentage.hour * 100) / 100,
          day: Math.round(usagePercentage.day * 100) / 100,
          month: Math.round(usagePercentage.month * 100) / 100
        }
      },
      reset_times: {
        minute: keyData.usage_reset_minute,
        hour: keyData.usage_reset_hour,
        day: keyData.usage_reset_day,
        month: keyData.usage_reset_month
      },
      last_used: keyData.last_used,
      status: status
    });
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default withAuth(handler);
