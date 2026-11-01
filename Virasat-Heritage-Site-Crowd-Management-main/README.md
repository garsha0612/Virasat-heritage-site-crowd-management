# Virasat – Heritage Crowd Management (Next.js 14 + React)
Run: `npm install && npm run dev` → http://localhost:3000
Add `public/heritage.mp4` (looping background video) and optional `public/poster.jpg`.

Routes: `/` home · `/sites/[id]` monument page · `/booking/[id]` confirmation
API: `GET /api/crowd?site=taj` (live stats) · `POST /api/book` (create booking)
Data is simulated in `lib/data.js` and `app/api/*` — swap for a real DB / sensors.
