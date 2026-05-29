# NEXA Campus Ecosystem Backend API Documentation

## Setup Environment Variables

Create `.env.local` in project root with the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# OCR.space (free tier with 500 pages/month)
OCR_SPACE_API_KEY=helloworld

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Telegram Bot API Telegram (for Pro feature - optional)
TELEGRAM_BOT_TOKEN=your-Telegram Bot API-account-sid
TELEGRAM_BOT_TOKEN=your-Telegram Bot API-auth-token
TELEGRAM_BOT_TOKEN=telegram:+14155238886

# Cron Secret (for reminders)
CRON_SECRET=your-secret-cron-token

# Midtrans (optional - for payment gateway)
MIDTRANS_SERVER_KEY=your-midtrans-server-key
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false
```

## API Endpoints

### Authentication (via Supabase Auth)
All endpoints require `Authorization: Bearer <session_token>` (handled automatically by Supabase client)

### Document Management

#### GET `/api/documents`
List all documents for current user.

**Response:**
```json
[
  {
    "id": "doc-uuid",
    "user_id": "user-uuid",
    "title": "Algoritma & Pemrograman",
    "file_path": "user-id/timestamp_filename.pdf",
    "file_url": null,
    "status": "completed",
    "error_message": null,
    "question_count": 25,
    "created_at": "2026-05-23T10:00:00Z"
  }
]
```

#### POST `/api/documents`
Create a new document (before uploading file).

**Request:**
```json
{
  "title": "Algoritma & Pemrograman",
  "filePath": "user-id/1234567890_algoritma.pdf"
}
```

**Validation:**
- `title`: Required, non-empty string
- `filePath`: Required, path where file is/will be stored
- Plan limits: Free (1), Basic (5), Pro (unlimited)

**Response:** `201 Created`
```json
{
  "id": "doc-uuid",
  "user_id": "user-uuid",
  "title": "Algoritma & Pemrograman",
  "file_path": "user-id/1234567890_algoritma.pdf",
  "status": "pending",
  "question_count": 0,
  "created_at": "2026-05-23T10:00:00Z"
}
```

#### DELETE `/api/documents?id=<docId>`
Delete document and cascade delete questions and related exam sessions.

**Query Parameters:**
- `id` (required): Document UUID

**Response:**
```json
{
  "data": { "success": true }
}
```

---

### Document Processing

#### POST `/api/process`
Process uploaded PDF: OCR + AI extraction (60s timeout)

**Request:**
```json
{
  "documentId": "doc-uuid",
  "filePath": "user-id/timestamp_filename.pdf"
}
```

**Flow:**
1. Verify document ownership
2. Download PDF from Supabase Storage (signed URL)
3. Extract text using OCR.space API
4. Parse questions using Google Gemini 1.5 Flash
5. Save questions to database
6. Update document status to `completed`

**Response:**
```json
{
  "data": {
    "documentId": "doc-uuid",
    "questionsExtracted": 25,
    "processingTime": 8.5
  }
}
```

**Error Cases:**
- `401`: User not authenticated
- `400`: Missing `documentId` or `filePath`
- `404`: Document not found
- `422`: Document already processed, OCR failed, or no questions found

---

### Exam Sessions

#### POST `/api/sessions`
Create new exam session from a document or study room.

**Request:**
```json
{
  "documentId": "doc-uuid",
  "studyRoomId": "room-uuid (optional)"
}
```

**Validation:**
- Document must be completed
- Document must have questions
- Plan session limits: Free (1), Basic (unlimited), Pro (unlimited)

**Response:**
```json
{
  "data": {
    "sessionId": "session-uuid"
  }
}
```

#### POST `/api/sessions/[id]/submit`
Submit exam answers and calculate score.

**Request:**
```json
{
  "answers": [
    {
      "questionId": "q-uuid",
      "selectedAnswer": "A"
    },
    {
      "questionId": "q-uuid-2",
      "selectedAnswer": null
    }
  ],
  "timeTaken": 3480
}
```

**Fields:**
- `answers`: Array of user answers
- `timeTaken`: Time in seconds
- `selectedAnswer`: Can be "A", "B", "C", "D", or `null` (unanswered)

**Calculation:**
- Score = (correct_count / total_questions) × 100
- Correct if `selectedAnswer === correctAnswer` from database

**Response:**
```json
{
  "data": {
    "score": 84,
    "correctCount": 21,
    "totalQuestions": 25,
    "sessionId": "session-uuid"
  }
}
```

**Database Updates:**
- Creates `session_answers` records
- Updates `exam_sessions` with score, `time_taken_seconds`, `completed_at`

---

### User Profile

#### GET `/api/user/profile`
Get current user's profile. Auto-creates profile on first access.

**Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "full_name": "Nama Pengguna",
  "avatar_url": "https://...",
  "plan": "basic",
  "telegram_number": "+62812345678",
  "created_at": "2026-05-23T10:00:00Z",
  "updated_at": "2026-05-23T10:00:00Z"
}
```

#### PUT `/api/user/profile`
Update user profile.

**Request:**
```json
{
  "full_name": "Nama Baru",
  "telegram_number": "+62812345678",
  "avatar_url": "https://..."
}
```

**Validation:**
- `telegram_number`: Must have at least 10 digits

**Response:** Updated profile object

---

### Study Rooms (Pro Plan Only)

#### GET `/api/study-rooms`
List all study rooms created by user or joined by user.

**Response:**
```json
[
  {
    "id": "room-uuid",
    "creator_id": "user-uuid",
    "document_id": "doc-uuid",
    "room_code": "ABC123",
    "title": "Belajar Bareng Algo",
    "is_active": true,
    "created_at": "2026-05-23T10:00:00Z",
    "expires_at": "2026-06-23T10:00:00Z"
  }
]
```

#### POST `/api/study-rooms`
Create a new study room (Pro only).

**Request:**
```json
{
  "title": "Belajar Bareng Algoritma",
  "documentId": "doc-uuid"
}
```

**Generation:**
- Unique 6-character room code (alphanumeric, no ambiguous chars like O/I/0/1)
- Auto-add creator as first participant
- Expires in 30 days

**Response:**
```json
{
  "data": {
    "roomId": "room-uuid",
    "roomCode": "ABC123"
  }
}
```

#### POST `/api/study-rooms/join`
Join a study room by code.

**Request:**
```json
{
  "roomCode": "ABC123"
}
```

**Validation:**
- Room must exist
- Room must be active
- Room must not be expired

**Response:**
```json
{
  "data": {
    "roomId": "room-uuid"
  }
}
```

#### Leaderboard
Automatically generated when viewing room detail page:
- Ranked by score (highest first)
- Tiebreaker: time_taken_seconds (lowest first)
- Shows only completed sessions

---

### Exam Schedules (Pro Plan Only)

#### GET `/api/schedules`
List all exam schedules.

**Response:**
```json
[
  {
    "id": "schedule-uuid",
    "user_id": "user-uuid",
    "subject_name": "Algoritma",
    "exam_date": "2026-06-15",
    "exam_time": "10:00",
    "document_id": "doc-uuid (optional)",
    "telegram_number": "+62812345678 (optional)",
    "reminder_sent_h3": false,
    "reminder_sent_h1": false,
    "reminder_sent_h0": false,
    "created_at": "2026-05-23T10:00:00Z"
  }
]
```

#### POST `/api/schedules`
Create exam schedule with automatic Telegram reminders (Pro only).

**Request:**
```json
{
  "subject_name": "Algoritma & Pemrograman",
  "exam_date": "2026-06-15",
  "exam_time": "10:00",
  "document_id": "doc-uuid (optional)",
  "telegram_number": "+62812345678 (optional, uses profile default if not provided)"
}
```

**Validation:**
- `subject_name`: Required
- `exam_date`: Required, valid date format
- `exam_time`: Optional
- `telegram_number`: Optional, must have ≥10 digits if provided

**Response:** `201 Created`
```json
{
  "id": "schedule-uuid",
  "user_id": "user-uuid",
  "subject_name": "Algoritma",
  "exam_date": "2026-06-15",
  "exam_time": "10:00",
  "reminder_sent_h3": false,
  "reminder_sent_h1": false,
  "reminder_sent_h0": false,
  "created_at": "2026-05-23T10:00:00Z"
}
```

#### PUT `/api/schedules?id=<scheduleId>`
Update schedule.

**Query:** `id` (required)

**Request:** Any of the above fields can be updated

#### DELETE `/api/schedules?id=<scheduleId>`
Delete schedule.

---

### Cron Jobs

#### POST `/api/cron/remind-exams`
Send Telegram reminders for upcoming exams (H-3, H-1, H-0).

**Setup Options:**

**Option 1: Vercel Cron (Recommended)**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/remind-exams",
      "schedule": "0 7 * * *"
    }
  ]
}
```

**Option 2: External Service (EasyCron, etc)**

URL: `POST https://your-domain.com/api/cron/remind-exams`

Header: `Authorization: Bearer {CRON_SECRET}`

**Option 3: Local Testing**

```bash
curl -X POST http://localhost:3001/api/cron/remind-exams \
  -H "Authorization: Bearer your-cron-secret"
```

**Logic:**
- Checks all Pro user schedules
- Sends Telegram if:
  - Exam in 3 days (`H-3`) AND not yet sent
  - Exam in 1 day (`H-1`) AND not yet sent
  - Exam today (`H-0`) AND not yet sent
- Updates `reminder_sent_h3/h1/h0` flags

**Response:**
```json
{
  "data": {
    "processed": 42,
    "sent": 8
  },
  "message": "Processed 42 schedules, sent 8 reminders"
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (plan limit, Pro-only feature)
- `404`: Not Found
- `422`: Unprocessable Entity (business logic error)
- `500`: Server Error

---

## Rate Limiting & Quotas

**Free Tier (OCR.space):**
- 500 pages/month

**Google Gemini 1.5 Flash:**
- Estimated $0.005 per question extraction (cost varies)
- Input: ~3,000 tokens per 12,000 chars
- Output: ~100-200 tokens per response

**Midtrans Payment:**
- Transaction fee follows the active Midtrans payment method and merchant agreement

---

## Testing

### Manual Testing

**1. Create Document & Process:**
```bash
# Create document
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","filePath":"test.pdf"}'

# Process document
curl -X POST http://localhost:3001/api/process \
  -H "Content-Type: application/json" \
  -d '{"documentId":"...","filePath":"..."}'
```

**2. Create & Submit Exam:**
```bash
# Create session
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"documentId":"..."}'

# Submit answers
curl -X POST http://localhost:3001/api/sessions/[sessionId]/submit \
  -H "Content-Type: application/json" \
  -d '{"answers":[{"questionId":"...","selectedAnswer":"A"}],"timeTaken":60}'
```

### Integration with Frontend

All frontend pages already have API calls:
- Dashboard: `GET /api/documents`, `/api/user/profile`
- Upload: `POST /api/documents` + `POST /api/process`
- Exam: `POST /api/sessions`, `POST /api/sessions/[id]/submit`
- Schedule: `GET/POST/PUT/DELETE /api/schedules`
- Study Room: `GET/POST /api/study-rooms`, `POST /api/study-rooms/join`
