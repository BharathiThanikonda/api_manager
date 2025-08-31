import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'API key is required',
          error: 'MISSING_API_KEY'
        }, 
        { status: 400 }
      );
    }

    // Check if the API key exists in the database
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', apiKey)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid API key',
          error: 'INVALID_API_KEY'
        }, 
        { status: 401 }
      );
    }

    // Update last_used timestamp
    await supabase
      .from('api_keys')
      .update({ 
        last_used: new Date().toISOString(),
        usage: (data.usage || 0) + 1
      })
      .eq('id', data.id);

    return NextResponse.json({
      success: true,
      message: 'API key is valid',
      data: {
        keyId: data.id,
        keyName: data.name,
        keyType: data.key_type,
        status: data.status,
        usage: data.usage + 1,
        monthlyLimit: data.monthly_limit,
        lastUsed: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('API validation error:', error);
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

// Also support GET requests for testing
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('apiKey');

  if (!apiKey) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'API key is required. Use ?apiKey=your_key_here',
        error: 'MISSING_API_KEY'
      }, 
      { status: 400 }
    );
  }

  // Reuse the same validation logic
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', apiKey)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid API key',
          error: 'INVALID_API_KEY'
        }, 
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key is valid',
      data: {
        keyId: data.id,
        keyName: data.name,
        keyType: data.key_type,
        status: data.status,
        usage: data.usage,
        monthlyLimit: data.monthly_limit,
        lastUsed: data.last_used
      }
    });

  } catch (error) {
    console.error('API validation error:', error);
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
