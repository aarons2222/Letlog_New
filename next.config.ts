import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security Headers Configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          // Content Security Policy - Prevent XSS attacks
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel.app *.supabase.co js.stripe.com",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com",
              "img-src 'self' data: blob: *.supabase.co *.vercel.app",
              "connect-src 'self' *.supabase.co api.stripe.com *.vercel.app wss://*.supabase.co",
              "frame-src js.stripe.com *.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          
          // Strict Transport Security - Enforce HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options', 
            value: 'DENY'
          },
          
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          
          // Control browser features and APIs
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=(self)',
              'usb=()',
              'magnetometer=()',
              'accelerometer=()',
              'gyroscope=()',
              'clipboard-write=(self)'
            ].join(', ')
          },
          
          // XSS Protection (legacy but still useful)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      },
      
      // Additional security for API routes
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate'
          }
        ]
      },
      
      // Security for dashboard/sensitive routes
      {
        source: '/(dashboard|settings)/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag', 
            value: 'noindex, nofollow'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
