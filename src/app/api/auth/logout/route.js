import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';

export async function POST(request) {
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

    // Clear the session by setting an expired cookie
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Logged out successfully'
      },
      { status: 200 }
    );

    // Clear the session cookie
    response.cookies.set('next-auth.session-token', '', {
      expires: new Date(0),
      path: '/',
    });

    response.cookies.set('__Secure-next-auth.session-token', '', {
      expires: new Date(0),
      path: '/',
      secure: true,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
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
