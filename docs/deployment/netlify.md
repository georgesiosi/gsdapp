---
last_updated: 2025-03-07
update_history:
  - 2025-03-07: Initial deployment documentation
---

# Netlify Deployment Guide

This document captures important lessons learned and best practices for deploying the GSD App to Netlify.

## Common Deployment Issues

### Dependencies Configuration

One of the most common issues with Next.js deployments on Netlify involves dependencies not being properly available during the build process. To avoid this:

- **UI and styling dependencies must be in `dependencies`, not `devDependencies`**
  - Libraries like `tailwindcss`, `tailwind-merge`, `@radix-ui/react-*` components, and PostCSS plugins are required at build time for production
  - Example error: `Cannot find module 'postcss-flexbugs-fixes'`
  - Fix: Move all UI and PostCSS-related packages from `devDependencies` to `dependencies` in package.json

```json
// Required in dependencies, not devDependencies
"dependencies": {
  "tailwindcss": "^3.3.0",
  "tailwind-merge": "^3.0.2",
  "postcss-flexbugs-fixes": "^5.0.2",
  "postcss-preset-env": "^10.1.5",
  "@radix-ui/react-dialog": "^1.1.6",
  // Additional UI components
}
```

### Next.js Configuration

- **Layout Metadata Handling**: Next.js 15+ requires using `generateMetadata` function instead of static `metadata` export
- **Image Configuration**: Properly configure `next.config.js` to handle external image domains

### Netlify Configuration Best Practices

Our optimized `netlify.toml` configuration:

```toml
[build]
  command = "npm run build"
  publish = ".next"
  # Prevent premature build termination
  timeout = "30m"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_USE_NETLIFY_EDGE = "true"
  NODE_VERSION = "20"
  # Force production environment
  NODE_ENV = "production"
  # Disable source maps for smaller bundles
  GENERATE_SOURCEMAP = "false"
  # Disable telemetry
  NEXT_TELEMETRY_DISABLED = "1"

# Production-specific optimizations
[context.production.environment]
  NEXT_COMPRESS = "true"

# Processing configuration
[build.processing]
  skip_processing = false
[build.processing.css]
  bundle = true
  minify = true
[build.processing.js]
  bundle = true
  minify = true
[build.processing.html]
  pretty_urls = true
[build.processing.images]
  compress = true

# Security and performance headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    # HTTP Strict Transport Security
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    # Caching for static assets
    Cache-Control = "public, max-age=31536000, immutable"
```

## Plugin Considerations

- **Avoid Deprecated Plugins**: The `netlify-plugin-cache-nextjs` plugin is deprecated and should not be used
- **Official Next.js Plugin**: The official `@netlify/plugin-nextjs` plugin already includes caching functionality
- **Plugin Configuration**: Only use supported configuration options for plugins

## Environment Variables

### Critical Authentication Variables

**IMPORTANT:** The following environment variables are REQUIRED for the application to function properly. Missing these will cause the app to show a loading screen indefinitely with `ERR_NAME_NOT_RESOLVED` errors:

- `CLERK_SECRET_KEY` - Your Clerk secret key from the Clerk dashboard
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Should be set to `/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Should be set to `/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` - Should be set to `/dashboard` or your main app page
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` - Should be set to `/dashboard` or your main app page

### Additional Important Variables

- `NEXT_PUBLIC_APP_URL` - Set to your Netlify deployment URL (e.g., `https://your-app.netlify.app`)
- `POLAR_API_KEY` - Your Polar API key for subscription management
- `OPENAI_API_KEY` - Your OpenAI API key for AI features

## Deployment Process

1. Ensure all dependencies are properly configured in package.json
2. Update `netlify.toml` with appropriate settings
3. Push changes to the production branch
4. Monitor build logs for any errors
5. Test the deployed application thoroughly

## Troubleshooting

- **Check build logs**: Most errors are clearly indicated in the build logs
- **Dependency issues**: Look for "Cannot find module" errors 
- **Plugin errors**: Check for unsupported configuration in `netlify.toml`
- **Environment variables**: Ensure all required environment variables are set
