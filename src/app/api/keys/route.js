import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'API key is required for authentication',
          error: 'MISSING_API_KEY'
        }, 
        { status: 401 }
      );
    }

    // First validate the API key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', apiKey)
      .eq('status', 'active')
      .single();

    if (keyError || !keyData) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid API key',
          error: 'INVALID_API_KEY'
        }, 
        { status: 401 }
      );
    }

    // Get all API keys for the authenticated user (you might want to add user_id field later)
    const { data: allKeys, error: allKeysError } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (allKeysError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error fetching API keys',
          error: 'FETCH_ERROR'
        }, 
        { status: 500 }
      );
    }

    // Calculate usage statistics
    const totalKeys = allKeys.length;
    const activeKeys = allKeys.filter(key => key.status === 'active').length;
    const totalUsage = allKeys.reduce((sum, key) => sum + (key.usage || 0), 0);

    return NextResponse.json({
      success: true,
      message: 'API keys retrieved successfully',
      data: {
        authenticatedKey: {
          id: keyData.id,
          name: keyData.name,
          keyType: keyData.key_type,
          status: keyData.status,
          usage: keyData.usage,
          monthlyLimit: keyData.monthly_limit,
          lastUsed: keyData.last_used,
          createdAt: keyData.created_at
        },
        statistics: {
          totalKeys,
          activeKeys,
          totalUsage,
          averageUsage: totalKeys > 0 ? Math.round(totalUsage / totalKeys) : 0
        },
        allKeys: allKeys.map(key => ({
          id: key.id,
          name: key.name,
          keyType: key.key_type,
          status: key.status,
          usage: key.usage,
          monthlyLimit: key.monthly_limit,
          lastUsed: key.last_used,
          createdAt: key.created_at
        }))
      }
    });

  } catch (error) {
    console.error('API keys error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      }, 
      { status: 500 }
    );
  }
}
