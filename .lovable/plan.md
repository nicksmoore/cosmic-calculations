
# Rebuild Project with Full Ownership

## What You Need to Do

### Step 1: Create a New Project
1. Go to [lovable.dev](https://lovable.dev) and click **"New Project"**
2. Give it a name (e.g., "Cosmic Calculations" or whatever you prefer)
3. Make sure you're creating it in **your own workspace** where you have full Owner permissions

### Step 2: Copy the Codebase
Once the new project is created, come back to **this chat** and tell me the new project is ready. I will then:

1. **Rebuild all the frontend code** -- the natal chart engine, astrocartography map, profile page, all components, hooks, data files, and styling
2. **Recreate the database schema** -- the `profiles` table (with RLS policies and auto-create trigger) and the `natal_chart_pdfs` table with storage bucket
3. **Recreate all 6 edge functions** -- geocode-location, generate-reading, daily-insight, extract-chart-from-pdf, create-podcast-checkout, get-mapbox-token
4. **Re-configure authentication** -- Google OAuth + email sign-in
5. **Re-add secrets** -- You'll need to re-enter your Stripe secret key and Mapbox token

### Step 3: Connect GitHub
Once the new project is fully built, go to **Settings -> GitHub -> Connect** and link your GitHub account. Since you'll be the full owner, permissions should work without issues.

## What Gets Migrated

| Category | Items |
|----------|-------|
| Pages | Index, Profile, TransitDetail, NotFound |
| Components | 28+ custom components (chart wheel, star field, intake forms, astrocartography, etc.) |
| Hooks | useAuth, useProfile, useEphemeris, useDailyInsight, useChartPdf, useTransitRefresh |
| Libraries | Ephemeris engine, synastry scoring, astrocartography calculations, chart patterns |
| Data files | Glossary, celebrity birth data, house interpretations, natal chart data |
| Database | profiles table, natal_chart_pdfs table, storage bucket, RLS policies, triggers |
| Edge Functions | 6 functions (geocode, reading, daily-insight, PDF extract, checkout, mapbox token) |
| Secrets | STRIPE_SECRET_KEY, VITE_MAPBOX_TOKEN (you'll re-enter these) |

## Important Notes

- **Your existing user data will NOT transfer** -- the new project gets a fresh database. Since you only have one user (yourself), this is no loss.
- **Dependencies** like `three.js`, `mapbox-gl`, `astronomia`, `recharts`, etc. will all be re-installed.
- The entire rebuild can be done in a few prompts once the new project exists.

## Your Action
Go create the new empty project on Lovable in your own workspace, then come back and let me know it's ready.
