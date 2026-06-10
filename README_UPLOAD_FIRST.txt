ROLLING WRENCH AI PROFESSIONAL - FINAL REPLACEMENT BUILD

Upload these files to your GitHub Pages repo root:
- index.html
- app.js
- style.css
- manifest.json
- service-worker.js
- icon-192.svg
- icon-512.svg
- diesel_catalog.json

Optional backend SQL files are in /backend_sql.
Run those in Supabase only if you are updating backend tables/RPCs.

Connected defaults:
- Render backend: https://rolling-wrench-ai-backend.onrender.com
- Supabase project: https://uxpkqwcmvtqvubibbrek.supabase.co

After upload:
1. Commit changes.
2. Wait for GitHub Pages.
3. Open app in Safari/Chrome.
4. Go Settings.
5. Tap TEST BACKEND.
6. Tap TEST SUPABASE.
7. Build a quote.
8. Build an invoice.
9. Sign the invoice.
10. Test OCR with a clear part label or receipt.

Main features:
- Shop / Roadside mode
- Parts lookup with local catalog + backend attempt + supplier web searches
- Quick Quote builder
- Invoice builder
- Customer signature pad
- Text quote / text invoice buttons
- VIN decode through NHTSA
- OCR receipt / part number scan through Tesseract
- 3 clocks: Start, Pause, Resume, Stop, Send To Invoice
- Finance dashboard
- Customer / truck local history
- Settings, themes, layout selector

Notes:
- Supplier live prices/inventory require supplier websites or APIs; app opens real supplier searches now.
- Backend endpoint paths must exist on Render for full AI/backend results. Local fallback keeps app usable if backend is offline.
- Supabase anon key is included for browser use. Keep service_role keys/private database passwords out of frontend files.
