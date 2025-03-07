/**
 * Health check endpoint for Polar.sh webhook
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
