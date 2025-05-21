import {NextResponse } from 'next/server';
import type {NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // Clone the response
  const response = NextResponse.next();

  // Add security headers
  const headers = response.headers;

  // Set Cross-Origin-Opener-Policy to same-origin-allow-popups
  // This allows the window.closed call that's being blocked
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  return response;
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    // Apply to all routes
    '/(.*)',
  ],
};
