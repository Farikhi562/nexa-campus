# Diktat.AI Deployment Guide

## Deployment Architecture

```
User Browser
    ↓
Vercel (Frontend + Backend API)
    ↓
├── Supabase (Database, Auth, Storage)
├── OpenAI (GPT-4o-mini API)
├── OCR.space (PDF extraction)
├── Twilio (WhatsApp notifications)
└── DOKU (Payment processing)
```

## Prerequisites for Production

- [ ] Vercel account (https://vercel.com)
- [ ] Supabase project with production database
- [ ] OpenAI API key with billing enabled
- [ ] Domain name (optional, Vercel provides .vercel.app)
- [ ] Twilio account (for WhatsApp - optional)
- [ ] DOKU merchant account (for payments - optional)

## Step 1: Prepare Repository

```bash
# Ensure all code is committed
git status
git add .
git commit -m "Ready for production deployment"

# Push to GitHub/GitLab (Vercel requirement)
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Via GitHub (Recommended)

1. **Connect Repository**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your Git provider (GitHub, GitLab, Bitbucket)
   - Choose the `diktat-ai` repository
   - Click "Import"

2. **Configure Project**
   - Framework: **Next.js**
   - Root directory: `.` (auto-detected)
   - Build command: `npm run build` (default)
   - Output directory: `.next` (default)

3. **Add Environment Variables**
   - Click "Environment Variables"
   - Add all variables from `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     SUPABASE_SERVICE_ROLE_KEY
     OPENAI_API_KEY
     OCR_SPACE_API_KEY
     NEXT_PUBLIC_APP_URL
     TWILIO_ACCOUNT_SID (optional)
     TWILIO_AUTH_TOKEN (optional)
     TWILIO_WHATSAPP_FROM (optional)
     CRON_SECRET
     DOKU_CLIENT_ID (optional)
     DOKU_SECRET_KEY (optional)
     DOKU_MERCHANT_ID (optional)
     DOKU_IS_PRODUCTION (optional)
     ```
   - Click "Deploy"

4. **Wait for Deployment**
   - Vercel automatically builds and deploys
   - Production URL: `https://diktat-ai.vercel.app` (or your domain)

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Or deploy to staging first
vercel
```

## Step 3: Configure Custom Domain (Optional)

1. **Add Domain**
   - Go to Vercel Dashboard → Project Settings → Domains
   - Add your custom domain (e.g., `diktat.ai`)
   - Follow DNS setup instructions

2. **Update DNS Records**
   - Point your domain's nameservers to Vercel
   - Or add CNAME records (see Vercel instructions)

3. **Enable HTTPS**
   - Vercel automatically provisions SSL certificate
   - HTTPS enabled within 24 hours

## Step 4: Enable Production Features

### Cron Jobs (Daily Reminders)

Cron is automatically enabled in production (via `vercel.json`):
- Schedule: **Daily at 7:00 AM UTC**
- Task: Send WhatsApp exam reminders

**Monitor Cron:**
- Vercel Dashboard → Project → Cron Jobs
- View execution logs and success/failure status

### Database Backups

1. **Enable in Supabase**
   - Project Settings → Database → Backups
   - Enable automatic daily backups
   - Set retention to 30+ days

2. **Point-in-Time Recovery**
   - Available for Pro Supabase plans
   - Can restore to any time in last 7 days

### Error Tracking (Optional)

Setup error monitoring:

```bash
npm install @sentry/nextjs
```

Add to `next.config.mjs`:
```javascript
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  // ... existing config
};

module.exports = withSentryConfig(nextConfig, {
  org: "your-org",
  project: "diktat-ai",
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
```

## Step 5: Verify Production

### Test All Endpoints

```bash
# Set PROD_URL to your Vercel domain
PROD_URL=https://diktat-ai.vercel.app

# Test API health
curl $PROD_URL/api/documents

# Monitor in Vercel dashboard
# Deployments → Recent → View Logs
```

### Test Critical Flows

- [ ] User registration (Google OAuth)
- [ ] Document upload
- [ ] OCR processing
- [ ] Exam session creation
- [ ] Answer submission
- [ ] Result export
- [ ] Study room creation
- [ ] WhatsApp reminder send (if Pro)

## Step 6: Monitor & Maintain

### Daily Checks

```bash
# View deployment logs
vercel logs diktat-ai

# Check Cron job status
# Via Dashboard: Project → Cron Jobs

# Monitor Supabase
# Via Dashboard: Project → Health → Metrics
```

### Weekly Tasks

- Review error logs (Sentry dashboard)
- Check API performance (Vercel Analytics)
- Monitor database usage (Supabase)
- Review user signups

### Monthly Tasks

- Backup critical data
- Update dependencies: `npm update`
- Review API costs
- Analyze user metrics

## Production Checklist

### Security

- [ ] All environment variables set in Vercel (no hardcoded secrets)
- [ ] HTTPS enabled and redirects HTTP to HTTPS
- [ ] Supabase RLS policies reviewed and enforced
- [ ] API rate limiting configured
- [ ] CORS properly configured for frontend domain
- [ ] Service role key never exposed in frontend code
- [ ] Cron secret protected with strong password

### Performance

- [ ] Database indexes created on frequently queried columns
- [ ] API response times < 2 seconds
- [ ] Frontend bundle size optimized (Vercel Analytics)
- [ ] Images optimized with Next.js Image component
- [ ] Database query performance monitored

### Reliability

- [ ] Automated backups enabled (Supabase)
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring enabled (e.g., Pingdom)
- [ ] Database connection pooling configured
- [ ] Cron jobs verified and working

### Compliance

- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] GDPR compliance reviewed (if EU users)
- [ ] Data retention policies documented
- [ ] User data export feature available

## Scaling Considerations

### Current Architecture Limits

**Supabase Free Tier:**
- 500 MB storage
- 1 GB bandwidth
- Limited connections

**When to upgrade:**
- More than 100 active users
- Monthly storage > 400 MB
- Database queries > 50k/month

### Upgrade Path

1. **Move to Supabase Pro** ($25/month)
   - Unlimited storage
   - Higher connection limits
   - Priority support

2. **Move to Vercel Pro** ($20/month)
   - More compute power
   - Faster deployments
   - Analytics

3. **Add Caching Layer** (optional)
   - Vercel Edge Cache
   - Redis/Upstash for session caching

## Rollback Plan

If deployment breaks production:

```bash
# Vercel automatically keeps last 10 deployments

# Option 1: Revert via Vercel Dashboard
# Deployments → Find working deployment → Click "Redeploy"

# Option 2: Via CLI
vercel rollback

# Option 3: Emergency downtime
# Push hotfix to main branch → auto-redeploy
```

## Cost Estimate (Monthly)

| Service | Free | Estimate | Notes |
|---------|------|----------|-------|
| Vercel | $0 | $20 (Pro) | Auto-scales based on usage |
| Supabase | $0 | $25 (Pro) | Per month after free tier |
| OpenAI API | - | $0-50 | Pay-per-usage, ~$0.005 per question |
| OCR.space | $0 | $0 | 500 pages/month free tier |
| Twilio | - | $0-20 | WhatsApp: ~$0.08/msg |
| Domain | - | $10-15 | Annual or monthly |
| **TOTAL** | **$0** | **$55-120** | Varies with usage |

## Monitoring Dashboard

Setup for 24/7 visibility:

1. **Vercel**
   - Deployments
   - Cron Jobs
   - Analytics
   - Logs

2. **Supabase**
   - Database Metrics
   - API Traffic
   - Storage Usage
   - Auth Events

3. **Sentry (Optional)**
   - Error Rate
   - Response Times
   - User Sessions

## Support & Troubleshooting

### Common Issues

**Cron job not running:**
- Check `vercel.json` exists
- Verify `CRON_SECRET` set
- View logs: `vercel logs diktat-ai --follow`

**WhatsApp not sending:**
- Verify Twilio credentials
- Check phone number format
- View Twilio logs: https://www.twilio.com/console/sms/logs

**Database connection timeout:**
- Upgrade Supabase plan
- Enable connection pooling
- Check network policies

**High API costs:**
- Reduce OpenAI tokens (optimize prompt)
- Implement caching
- Batch API requests

## References

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- OpenAI API: https://platform.openai.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
