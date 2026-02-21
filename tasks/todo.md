# Astro-Profile Redesign — Task Tracking

Plan: `docs/plans/2026-02-19-astro-profile-redesign.md`
Date: 2026-02-20

## Tasks

- [ ] Task 1: BottomNav component + App.tsx wiring
- [ ] Task 2: DB migration — transit_snapshot column (⚠️ SQL step is manual)
- [ ] Task 3: Feed Sky Header (TodaysPlanetaryBar + Mercury retrograde indicator)
- [ ] Task 4: Vibe Progress Bar in DailyInsightPanel
- [ ] Task 5: Transit Stamp on posts
- [ ] Task 6: PostComposer Sheet (Post tab in BottomNav)
- [ ] Task 7: Profile page redesign
- [ ] Task 8: Match page + useMatchFeed + Public Profile page

## Notes

- Task 2, Step 1: Must run SQL manually in Supabase dashboard:
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS transit_snapshot JSONB;`
- TodaysPlanetaryBar uses `isRetrograde` (not `retrograde`) on TransitPlanet — plan uses correct field name in intent
