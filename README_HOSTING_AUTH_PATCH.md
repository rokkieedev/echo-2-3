Summary of fixes

1) SPA routing on hosts (white screen, 404s)
- Added public/_redirects with: `/* /index.html 200` to enable client-side routing on Netlify, Cloudflare Pages, and similar static hosts.
- Added vercel.json with universal rewrite to /index.html so routes like /admin and /tests resolve correctly on Vercel.

2) Admin auth bypass (local)
- Changed admin auth persistence from localStorage to sessionStorage in src/hooks/useCustomAdminAuth.ts. This enforces a fresh sign‑in each browser session and prevents permanent bypass after one successful login.
- No business logic or UI changes; only storage scope adjusted.

3) Render preview host block (502 / blocked host)
- Updated vite.config.ts to include preview config:
  - host: true, port: process.env.PORT || 8080, strictPort: true, allowedHosts: true
  - This allows Render domains (e.g., exam-echo-hub-4.onrender.com) and binds to the platform port.

What changed (files)
- src/hooks/useCustomAdminAuth.ts: localStorage -> sessionStorage for token read/write/removal.
- public/_redirects: new file with SPA fallback rule.
- vercel.json: new file with SPA rewrites.
- vite.config.ts: added preview.{host, port, strictPort, allowedHosts} for Render.

Why
- Static hosts serve deep links directly and return 404 without SPA fallback; rewrites ensure the app bootstraps for all paths, fixing white screens/404s.
- Persistent localStorage token caused admin panel to remain unlocked locally; sessionStorage scopes auth to the current browser session, requiring credentials again on new sessions and across reloads.
- Render uses `vite preview` by default for web services; allowing the host and binding to PORT fixes the "Blocked request" and 502.

Verification steps (A/B from request)
A. Local prod build
- npm ci
- npm run build (outputs dist/)
- npm run preview (serves dist/)
- Visit routes: /, /tests, /admin, /admin/auth — all should load without white screen.

B. Hosting checks
- Netlify/Cloudflare: Ensure publish directory is dist/ and that public/_redirects is included in deploy artifact.
- Vercel: vercel.json present; Vercel will rewrite all paths to /index.html so /admin and quick-action links work.
- Render: Start command may run `vite preview`. The updated vite.config.ts now permits Render hostnames and uses the platform PORT automatically.

Notes
- No DB/schema changes applied automatically. For precise books categorization, propose adding `exam_type` column to `books` (ENUM: 'JEE' | 'NEET') and updating admin upload to set it; frontend currently filters by subject sets (JEE excludes Biology; NEET excludes Mathematics) to avoid cross‑listing.
- Percentile/AIR: Improved edge handling. For exact production reliability, seed `jee_percentiles` with dense marks vs percentile data (approval needed) and optionally add a config for total candidates per exam.
- If you deploy under a subpath, set Vite base accordingly; otherwise defaults work for root deployments.
