# Diktat.AI Backend Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (https://supabase.com)
- OpenAI API key (https://platform.openai.com/api-keys)
- OCR.space free API key (https://ocr.space)

## Step 1: Clone & Install Dependencies

```bash
cd diktat-ai
npm install
```

## Step 2: Setup Supabase

### Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization and region
4. Set password and wait for project to be ready

### Run SQL Schema
1. Navigate to SQL Editor in Supabase dashboard
2. Open `supabase/schema.sql` from this repo
3. Copy entire SQL and paste into editor
4. Click "Run"

This creates:
- `profiles` - User accounts and plans
- `documents` - Uploaded PDF documents
- `questions` - Extracted questions with answers
- `exam_sessions` - User exam attempts
- `session_answers` - Individual question answers
- `study_rooms` - Collaborative study sessions
- `room_participants` - Study room members
- `schedules` - Exam schedules for reminders

### Get API Keys
1. Go to Project Settings → API
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Enable Google OAuth (Optional)
1. Go to Authentication → Providers
2. Enable "Google"
3. Set redirect URL: `http://localhost:3001/auth/callback`
4. Add your Google OAuth credentials

## Step 3: Setup OpenAI

### Get API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `.env.local` as `OPENAI_API_KEY`

### Add Billing
1. Go to Billing → Overview
2. Add payment method
3. Set usage limits (recommended: $20/month for testing)

## Step 4: Setup OCR.space

### Get Free Key
1. Go to https://ocr.space/ocrapi
2. Request free API key (optional - default `helloworld` allows 500 pages/month)
3. Enter key in `.env.local` as `OCR_SPACE_API_KEY`

## Step 5: Setup Environment Variables

```bash
# Copy template
cp .env.local.example .env.local

# Edit with your keys
# Linux/Mac:
nano .env.local
# Windows:
notepad .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `CRON_SECRET` (generate: `openssl rand -base64 32`)

## Step 6: Run Local Development

```bash
npm run dev
```

Server runs at http://localhost:3001

**Test endpoints:**

```bash
# Get user profile (requires auth)
curl http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer <session_token>"

# List documents
curl http://localhost:3001/api/documents \
  -H "Authorization: Bearer <session_token>"
```

## Step 7: Setup Whatsapp Reminders (Pro Feature - Optional)

### Get Twilio Credentials
1. Go to https://www.twilio.com/console
2. Get Account SID and Auth Token
3. Add Telegram sandbox:
   - Go to Messaging → Try it out → Send a Telegram
   - Follow setup steps
   - Get `TWILIO_WHATSAPP_FROM` number

### Update .env.local
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=telegram:+14155238886
```

### Test Reminder
```bash
curl -X POST http://localhost:3001/api/cron/remind-exams \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

## Step 8: Deploy to Vercel (Recommended)

### Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Configure Environment in Vercel Dashboard
1. Go to Project Settings → Environment Variables
2. Add all `.env.local` variables
3. Redeploy

### Enable Cron Jobs
- `vercel.json` already configured
- Cron runs daily at 7 AM UTC
- Platform automatically handles execution

## API Testing Checklist

### Basic Flow
- [ ] User registration/login
- [ ] Get user profile
- [ ] Upload PDF
- [ ] Process document (OCR + AI)
- [ ] Create exam session
- [ ] Submit exam answers
- [ ] View results

### Pro Features
- [ ] Create study room
- [ ] Join study room by code
- [ ] View leaderboard
- [ ] Create exam schedule
- [ ] Send test Telegram reminder

## Troubleshooting

### "Unauthorized" on API calls
- Check if user is logged in
- Verify Supabase session cookie exists
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct

### OCR extraction returns empty
- Verify PDF has readable text (not scanned image)
- Check file size < 10MB
- Try simpler PDF first

### OpenAI quota exceeded
- Check API key is valid
- Verify billing set up in OpenAI dashboard
- Check usage at https://platform.openai.com/account/usage

### Telegram not sending
- Verify Twilio credentials in `.env.local`
- Check Telegram number format (international)
- Confirm phone number is registered with Twilio sandbox

### Database errors
- Verify Supabase SQL schema was run
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct
- Verify tables exist: `select * from information_schema.tables`

## Production Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Database backups configured in Supabase
- [ ] Error logging setup (e.g., Sentry)
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Payment gateway tested (DOKU)
- [ ] Twilio Telegram moved out of sandbox
- [ ] Database Row Level Security (RLS) policies reviewed
- [ ] API rate limits set in Supabase

## File Structure

```
src/app/api/
├── documents/route.ts          # CRUD documents
├── process/route.ts             # OCR + AI extraction
├── sessions/
│   ├── route.ts                # Create exam session
│   └── [id]/submit/route.ts    # Submit answers
├── user/
│   └── profile/route.ts         # User profile
├── schedules/route.ts           # Exam schedules
├── study-rooms/
│   ├── route.ts                # List/create rooms
│   └── join/route.ts           # Join room by code
└── cron/
    └── remind-exams/route.ts   # Telegram reminders

src/lib/
├── ocr.ts                       # OCR.space integration
├── openai.ts                    # GPT-4o-mini extraction
└── supabase/
    ├── client.ts               # Client-side Supabase
    └── server.ts               # Server-side Supabase
```

## Next Steps

1. **Payment Integration**: Implement DOKU payment flow
2. **Analytics**: Add event tracking (e.g., Mixpanel)
3. **Admin Dashboard**: Build admin interface for monitoring
4. **AI Improvements**: Fine-tune prompts for better extraction
5. **Mobile App**: Develop React Native version
6. **API Improvements**: Add WebSocket for real-time leaderboard
