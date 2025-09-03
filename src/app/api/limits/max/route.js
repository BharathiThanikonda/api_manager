import { NextResponse } from 'next/server';
import { getMaxAllowedLimits } from '../../../../lib/rateLimit';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyType = searchParams.get('keyType') || 'development';

    const maxLimits = getMaxAllowedLimits(keyType);

    return NextResponse.json({
      success: true,
      data: {
        keyType,
        maxLimits,
        description: {
          minute: `Maximum ${maxLimits.minute} requests per minute`,
          hour: `Maximum ${maxLimits.hour} requests per hour`,
          day: `Maximum ${maxLimits.day} requests per day`,
          month: `Maximum ${maxLimits.month} requests per month`
        }
      }
    });
  } catch (error) {
    console.error('Error fetching max limits:', error);
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
