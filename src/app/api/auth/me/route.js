import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { supabase } from '../../../../lib/supabase';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No active session found',
          error: 'NO_SESSION'
        }, 
        { status: 401 }
      );
    }

    // Get user details from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, image_url, created_at, last_login')
      .eq('email', session.user.email)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error fetching user data',
          error: 'FETCH_ERROR'
        }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.image_url,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
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
