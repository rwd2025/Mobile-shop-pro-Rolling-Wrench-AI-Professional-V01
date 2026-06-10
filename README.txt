Rolling Wrench AI Shop + Road Connected Build

Connected defaults:
- Render backend: https://rolling-wrench-ai-backend.onrender.com
- Supabase project: https://uxpkqwcmvtqvubibbrek.supabase.co

What is wired:
- /api/ai for Ask Rolling Wrench AI
- /api/parts with /api/search fallback for parts lookup
- /api/vision for OCR receipt/part parsing
- /api/quotes and /api/invoices for backend saves
- Supabase best-effort saves for customers, trucks, quotes, invoices, and OCR results
- NHTSA VIN decode with truck save
- 3 job clocks with start/pause/resume/stop/send to quote
- Service call on/off, shop/road mode, supplier web searches

Before public use:
- Run your Supabase schema for customers/trucks/quotes/invoices/ocr_results or let Render handle saves.
- Confirm RLS policies before storing real customer data.
- In Settings, tap TEST BACKEND and TEST SUPABASE.
