import { supabase } from './supabase';

// Built-in rate limit configuration (these are the maximum limits for each API)
const BUILTIN_RATE_LIMITS = {
  development: {
    requests_per_minute: 1,
    requests_per_hour: 10,
    requests_per_day: 100,
    requests_per_month: 1000
  },
  production: {
    requests_per_minute: 10,
    requests_per_hour: 100,
    requests_per_day: 1000,
    requests_per_month: 1000  // Changed from 10000 to 1000
  }
};

// Function to check and reset usage counters if needed
const checkAndResetUsage = async (apiKeyId) => {
  const now = new Date();
  
  // Get current usage data
  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select(`
      usage_current_month, usage_current_day, usage_current_hour, usage_current_minute,
      usage_reset_month, usage_reset_day, usage_reset_hour, usage_reset_minute,
      builtin_monthly_limit, builtin_daily_limit, builtin_hourly_limit, builtin_minute_limit,
      user_monthly_limit, user_daily_limit, user_hourly_limit, user_minute_limit
    `)
    .eq('id', apiKeyId)
    .single();

  if (error || !keyData) {
    throw new Error('Failed to fetch API key usage data');
  }

  const updates = {};
  let needsUpdate = false;

  // Check and reset monthly usage
  if (new Date(keyData.usage_reset_month) <= now) {
    updates.usage_current_month = 0;
    updates.usage_reset_month = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    needsUpdate = true;
  }

  // Check and reset daily usage
  if (new Date(keyData.usage_reset_day) <= now) {
    updates.usage_current_day = 0;
    updates.usage_reset_day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    needsUpdate = true;
  }

  // Check and reset hourly usage
  if (new Date(keyData.usage_reset_hour) <= now) {
    updates.usage_current_hour = 0;
    updates.usage_reset_hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1).toISOString();
    needsUpdate = true;
  }

  // Check and reset minute usage
  if (new Date(keyData.usage_reset_minute) <= now) {
    updates.usage_current_minute = 0;
    updates.usage_reset_minute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1).toISOString();
    needsUpdate = true;
  }

  // Update the database if any resets are needed
  if (needsUpdate) {
    const { error: updateError } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', apiKeyId);

    if (updateError) {
      throw new Error('Failed to reset usage counters');
    }

    // Update the local data with reset values
    Object.assign(keyData, updates);
  }

  return keyData;
};

// Function to check rate limits
export const checkRateLimit = async (apiKeyId) => {
  try {
    // Check and reset usage counters if needed
    const keyData = await checkAndResetUsage(apiKeyId);
    
    const now = new Date();
    const currentUsage = {
      minute: keyData.usage_current_minute || 0,
      hour: keyData.usage_current_hour || 0,
      day: keyData.usage_current_day || 0,
      month: keyData.usage_current_month || 0
    };

    const builtinLimits = {
      minute: keyData.builtin_monthly_limit || BUILTIN_RATE_LIMITS.development.requests_per_minute,
      hour: keyData.builtin_hourly_limit || BUILTIN_RATE_LIMITS.development.requests_per_hour,
      day: keyData.builtin_daily_limit || BUILTIN_RATE_LIMITS.development.requests_per_day,
      month: keyData.builtin_monthly_limit || BUILTIN_RATE_LIMITS.development.requests_per_month
    };

    const userLimits = {
      minute: keyData.user_minute_limit,
      hour: keyData.user_hourly_limit,
      day: keyData.user_daily_limit,
      month: keyData.user_monthly_limit
    };

    // Check built-in limits first (these are hard limits that cannot be exceeded)
    if (currentUsage.minute >= builtinLimits.minute) {
      return {
        allowed: false,
        reason: 'BUILTIN_MINUTE_LIMIT_EXCEEDED',
        limitType: 'builtin',
        period: 'minute',
        limit: builtinLimits.minute,
        current: currentUsage.minute,
        resetTime: keyData.usage_reset_minute
      };
    }

    if (currentUsage.hour >= builtinLimits.hour) {
      return {
        allowed: false,
        reason: 'BUILTIN_HOUR_LIMIT_EXCEEDED',
        limitType: 'builtin',
        period: 'hour',
        limit: builtinLimits.hour,
        current: currentUsage.hour,
        resetTime: keyData.usage_reset_hour
      };
    }

    if (currentUsage.day >= builtinLimits.day) {
      return {
        allowed: false,
        reason: 'BUILTIN_DAY_LIMIT_EXCEEDED',
        limitType: 'builtin',
        period: 'day',
        limit: builtinLimits.day,
        current: currentUsage.day,
        resetTime: keyData.usage_reset_day
      };
    }

    if (currentUsage.month >= builtinLimits.month) {
      return {
        allowed: false,
        reason: 'BUILTIN_MONTH_LIMIT_EXCEEDED',
        limitType: 'builtin',
        period: 'month',
        limit: builtinLimits.month,
        current: currentUsage.month,
        resetTime: keyData.usage_reset_month
      };
    }

    // Check user limits (these are tracking limits for user's own monitoring)
    if (userLimits.minute && currentUsage.minute >= userLimits.minute) {
      return {
        allowed: false,
        reason: 'USER_MINUTE_LIMIT_EXCEEDED',
        limitType: 'user',
        period: 'minute',
        limit: userLimits.minute,
        current: currentUsage.minute,
        resetTime: keyData.usage_reset_minute
      };
    }

    if (userLimits.hour && currentUsage.hour >= userLimits.hour) {
      return {
        allowed: false,
        reason: 'USER_HOUR_LIMIT_EXCEEDED',
        limitType: 'user',
        period: 'hour',
        limit: userLimits.hour,
        current: currentUsage.hour,
        resetTime: keyData.usage_reset_hour
      };
    }

    if (userLimits.day && currentUsage.day >= userLimits.day) {
      return {
        allowed: false,
        reason: 'USER_DAY_LIMIT_EXCEEDED',
        limitType: 'user',
        period: 'day',
        limit: userLimits.day,
        current: currentUsage.day,
        resetTime: keyData.usage_reset_day
      };
    }

    if (userLimits.month && currentUsage.month >= userLimits.month) {
      return {
        allowed: false,
        reason: 'USER_MONTH_LIMIT_EXCEEDED',
        limitType: 'user',
        period: 'month',
        limit: userLimits.month,
        current: currentUsage.month,
        resetTime: keyData.usage_reset_month
      };
    }

    return { 
      allowed: true, 
      currentUsage,
      builtinLimits,
      userLimits
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: false, reason: 'RATE_LIMIT_CHECK_ERROR' };
  }
};

// Function to update API usage
export const updateApiUsage = async (apiKeyId) => {
  try {
    // First, get the current usage values
    const { data: currentData, error: fetchError } = await supabase
      .from('api_keys')
      .select('usage_current_month, usage_current_day, usage_current_hour, usage_current_minute')
      .eq('id', apiKeyId)
      .single();

    if (fetchError) {
      console.error('Error fetching current usage:', fetchError);
      throw fetchError;
    }

    // Update with incremented values
    const { error } = await supabase
      .from('api_keys')
      .update({ 
        usage_current_month: (currentData.usage_current_month || 0) + 1,
        usage_current_day: (currentData.usage_current_day || 0) + 1,
        usage_current_hour: (currentData.usage_current_hour || 0) + 1,
        usage_current_minute: (currentData.usage_current_minute || 0) + 1,
        last_used: new Date().toISOString()
      })
      .eq('id', apiKeyId);

    if (error) {
      console.error('Error updating API usage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating API usage:', error);
    throw error;
  }
};

// Function to get rate limit headers
export const getRateLimitHeaders = (currentUsage, builtinLimits, userLimits) => {
  const headers = {};
  
  // Add built-in limit headers
  headers['X-RateLimit-Builtin-Minute-Limit'] = builtinLimits.minute;
  headers['X-RateLimit-Builtin-Minute-Remaining'] = Math.max(0, builtinLimits.minute - currentUsage.minute);
  headers['X-RateLimit-Builtin-Minute-Used'] = currentUsage.minute;
  
  headers['X-RateLimit-Builtin-Hour-Limit'] = builtinLimits.hour;
  headers['X-RateLimit-Builtin-Hour-Remaining'] = Math.max(0, builtinLimits.hour - currentUsage.hour);
  headers['X-RateLimit-Builtin-Hour-Used'] = currentUsage.hour;
  
  headers['X-RateLimit-Builtin-Day-Limit'] = builtinLimits.day;
  headers['X-RateLimit-Builtin-Day-Remaining'] = Math.max(0, builtinLimits.day - currentUsage.day);
  headers['X-RateLimit-Builtin-Day-Used'] = currentUsage.day;
  
  headers['X-RateLimit-Builtin-Month-Limit'] = builtinLimits.month;
  headers['X-RateLimit-Builtin-Month-Remaining'] = Math.max(0, builtinLimits.month - currentUsage.month);
  headers['X-RateLimit-Builtin-Month-Used'] = currentUsage.month;

  // Add user limit headers if they exist
  if (userLimits.minute) {
    headers['X-RateLimit-User-Minute-Limit'] = userLimits.minute;
    headers['X-RateLimit-User-Minute-Remaining'] = Math.max(0, userLimits.minute - currentUsage.minute);
    headers['X-RateLimit-User-Minute-Used'] = currentUsage.minute;
  }
  
  if (userLimits.hour) {
    headers['X-RateLimit-User-Hour-Limit'] = userLimits.hour;
    headers['X-RateLimit-User-Hour-Remaining'] = Math.max(0, userLimits.hour - currentUsage.hour);
    headers['X-RateLimit-User-Hour-Used'] = currentUsage.hour;
  }
  
  if (userLimits.day) {
    headers['X-RateLimit-User-Day-Limit'] = userLimits.day;
    headers['X-RateLimit-User-Day-Remaining'] = Math.max(0, userLimits.day - currentUsage.day);
    headers['X-RateLimit-User-Day-Used'] = currentUsage.day;
  }
  
  if (userLimits.month) {
    headers['X-RateLimit-User-Month-Limit'] = userLimits.month;
    headers['X-RateLimit-User-Month-Remaining'] = Math.max(0, userLimits.month - currentUsage.month);
    headers['X-RateLimit-User-Month-Used'] = currentUsage.month;
  }

  return headers;
};

// Function to validate user limits against built-in limits
export const validateUserLimits = (keyType, userLimits) => {
  const builtinLimits = BUILTIN_RATE_LIMITS[keyType] || BUILTIN_RATE_LIMITS.development;
  const errors = [];

  if (userLimits.minute && userLimits.minute > builtinLimits.requests_per_minute) {
    errors.push(`Minute limit cannot exceed ${builtinLimits.requests_per_minute} (maximum allowed)`);
  }

  if (userLimits.hour && userLimits.hour > builtinLimits.requests_per_hour) {
    errors.push(`Hour limit cannot exceed ${builtinLimits.requests_per_hour} (maximum allowed)`);
  }

  if (userLimits.day && userLimits.day > builtinLimits.requests_per_day) {
    errors.push(`Day limit cannot exceed ${builtinLimits.requests_per_day} (maximum allowed)`);
  }

  if (userLimits.month && userLimits.month > builtinLimits.requests_per_month) {
    errors.push(`Month limit cannot exceed ${builtinLimits.requests_per_month} (maximum allowed)`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Function to get maximum allowed limits for UI display
export const getMaxAllowedLimits = (keyType) => {
  const builtinLimits = BUILTIN_RATE_LIMITS[keyType] || BUILTIN_RATE_LIMITS.development;
  
  return {
    minute: builtinLimits.requests_per_minute,
    hour: builtinLimits.requests_per_hour,
    day: builtinLimits.requests_per_day,
    month: builtinLimits.requests_per_month
  };
};
