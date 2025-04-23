# Tech Context

This document outlines the core technologies, frameworks, and configurations used in the `gsdapp` project.

## Core Technologies

*   **Framework:** Next.js (v15+)
*   **Language:** TypeScript (v5.7+)
*   **UI Library:** React (v18)
*   **Styling:** Tailwind CSS (v3.3+) with CSS Variables for theming. Dark mode is enabled via class strategy. Uses `tailwindcss-animate` plugin.
*   **Component Library:** Shadcn UI (built on Radix UI primitives)
*   **State Management:** Zustand
*   **Backend & Database:** Convex
*   **Authentication:** Clerk (including image hosting via `img.clerk.com`)
*   **Forms:** React Hook Form (v7+)
*   **Schema Validation:** Zod (likely used with React Hook Form)
*   **API Client (AI):** OpenAI SDK (`openai` package)

## Development & Build

*   **Package Manager:** npm (implied by `package-lock.json`)
*   **Module System:** ESNext (as per `tsconfig.json`)
*   **TypeScript Config:**
    *   Strict mode enabled.
    *   Path aliases configured (`@/*`, `@/components/*`, etc.).
    *   Targets ES2017.
*   **Linting/Type Checking:** ESLint and TypeScript checks are configured but **ignored during builds** (`eslint.ignoreDuringBuilds: true`, `typescript.ignoreBuildErrors: true` in `next.config.mjs`).
*   **Testing:** Jest with React Testing Library (`@testing-library/react`) and `ts-jest`. Setup configured in `jest.setup.js` and `package.json`.
*   **Configuration Consistency:** Ensure environment variables (e.g., `PORT`, `NEXT_PUBLIC_APP_URL` in `.env.*` files) align with runtime configurations (e.g., ports in `package.json` scripts, `docker-compose.yml`). Mismatches can cause initialization or runtime errors.

## Deployment & Environment

*   **Potential Deployment:** Netlify (indicated by `netlify.toml`) and/or Docker (indicated by `Dockerfile`, `docker-compose.yml`).
*   **Environment Variables:** Uses `.env` files (e.g., `.env.local`) for configuration like `OPENAI_API_KEY`.

## Other Notable Libraries

*   `lucide-react`: For icons.
*   `date-fns`: For date/time manipulation.
*   `react-confetti`: For visual effects.
*   `sonner`: For toast notifications.
*   `chart.js`: For rendering charts.

## Potential Features/Configurations

*   **PWA:** Presence of `sw.js` and `manifest.json` along with specific caching headers in `next.config.mjs` suggests potential Progressive Web App capabilities.
