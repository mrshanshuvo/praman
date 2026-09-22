# Praman — MVP 3 Roadmap (Direction A: Personal Power Tool)

Scope: compound Praman's value for your own job search — capture JDs faster, track applications, automate outreach — without taking on multi-tenant/commercialization overhead. No new anti-hallucination surface is introduced without the same validation pattern established in MVP 1/2.

---

## 0. Design Constraint Set Before Building Anything

1. **No background scraping of LinkedIn/Indeed.** Automated scraping violates LinkedIn's terms and has led to real account restrictions for users. The extension must be **manual capture only**: you're on a job page you're already viewing, you click the extension icon, it reads the visible page DOM once and sends it to Praman. No polling, no background jobs, no bulk fetching, no bypassing login walls.
2. **Gmail integration is draft-creation only, never auto-send.** Every outreach email must land as a Gmail draft for you to review and send yourself — this preserves the human-in-the-loop check that's been catching real bugs throughout MVP 1/2 testing. Auto-send removes exactly the safety net that found the BeeCrowd and outreach-number issues.
3. **Any new free-text generation surface reuses `validateFreeText()`** — no new prompt gets to skip the qualitative/quantitative claim validation pattern already established.

---

## 1. Chrome Extension — 1-Click JD Import

**Architecture:**
- Manifest V3 extension, minimal permissions (`activeTab` only — not broad host permissions, since it only ever acts on the page you're currently viewing and clicking on).
- Content script runs on-demand (triggered by the toolbar icon click, not injected automatically on page load) to extract: job title, company, and the JD body text from the visible DOM.
- Since LinkedIn/Indeed page structure varies and changes over time, extraction should be resilient: look for common JD container patterns first, but always fall back to "grab the largest visible text block" plus let the user manually adjust the captured text in a popup before submitting — don't silently send something wrong to the backend.
- Popup UI: shows the captured title/company/JD text, editable before submit, "Send to Praman" button.
- Auth: extension holds a long-lived API token (generated from your Praman account settings, not your session cookie) sent as a bearer token — simpler and safer than trying to share cookies/session state between extension and web app.

**Backend additions:**
- `POST /extension/job-descriptions` — same as the existing `POST /job-descriptions` but accepts an API-token-authenticated request (new auth guard) instead of session/JWT cookie auth, plus optional `sourceUrl` and `company` fields for tracker pre-fill.
- New `ApiToken` model: `{ id, userId, token (hashed), label, createdAt, lastUsedAt }`, manageable from a new `/settings/api-tokens` page (generate/revoke).

**DB additions:**
```prisma
model ApiToken {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  tokenHash  String   @unique
  label      String
  createdAt  DateTime @default(now())
  lastUsedAt DateTime?
}
```

---

## 2. Job Application Kanban Tracker (extends existing Kanban from MVP 2)

MVP 2 already has a Kanban board (Saved/Applied/Interviewing/Offer/Rejected) — MVP 3 extends it with the pieces that make it a real tracker rather than a status label:

- **Stage granularity:** extend beyond the current 5 stages to include interview sub-stages (Phone Screen → Technical Round → Onsite/Final → Offer), matching what you actually described wanting.
- **Linked resume version:** each `JobDescription` card should show which `Resume` version was actually submitted for that application (pull from the version history already built in MVP 2) — this matters because you'll want to know exactly what you claimed when a recruiter calls back weeks later.
- **Timeline/activity log:** a simple append-only log per JD (`stage changed to X on date`, `note added`, `interview scheduled`) rather than a fully separate "milestones" system — keep this lightweight, it's for your own reference, not a project management tool.
- **Reminders (optional, low priority):** a simple "follow up by" date field with a dashboard widget listing overdue follow-ups — skip building actual notifications/emails for this in MVP 3, a visible list is enough for personal use.

**DB additions:**
```prisma
model ApplicationEvent {
  id               String   @id @default(cuid())
  jobDescriptionId String
  jobDescription   JobDescription @relation(fields: [jobDescriptionId], references: [id])
  type             String   // "stage_change" | "note" | "interview_scheduled"
  detail           String
  createdAt        DateTime @default(now())
}
```
Add `stage: ApplicationStage`, `submittedResumeId: String?`, `followUpDate: DateTime?` to `JobDescription`.

---

## 3. Outreach Automation — Gmail Draft Creation

**Architecture:**
- Use the Gmail API with OAuth (per §0.2, drafts only — request the `gmail.compose` scope, not `gmail.send`, which structurally prevents auto-send even if something else in the flow misbehaves).
- New endpoint: `POST /job-descriptions/:id/outreach/draft` — takes the already-generated (and already-validated, per MVP 2's `validateFreeText()`) outreach email content and creates a Gmail draft via the API, returning a link to open it in Gmail.
- Store `recruiterEmail` (if known) on the JD or as a separate contact field so drafts can be pre-addressed.
- Token storage for Gmail OAuth: same `httpOnly` cookie / secure server-side storage discipline as the auth refresh-token fix — don't regress on that pattern for a new integration.

**DB additions:**
```prisma
model GmailIntegration {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  refreshToken  String   // encrypted at rest
  connectedAt   DateTime @default(now())
}
```

---

## 4. Frontend Additions

- `/settings/api-tokens` — generate/revoke extension tokens
- `/settings/integrations` — connect/disconnect Gmail
- `/jobs` Kanban view — extended stages, follow-up date badges, linked resume version shown per card
- `/jobs/[id]` — new "Timeline" tab showing the `ApplicationEvent` log
- Extension popup (separate small React/vanilla build, not part of the main Next.js app)

---

## 5. Recommended Build Order

1. API token model + `/extension/job-descriptions` endpoint + `/settings/api-tokens` page (backend-first, testable via curl before the extension exists)
2. Chrome extension: manual capture + popup + submit flow, tested against real LinkedIn/Indeed job pages you're actually looking at
3. Kanban stage extension + `ApplicationEvent` timeline (schema + UI)
4. Gmail OAuth connection flow + draft-creation endpoint
5. Wire outreach email generation (already exists from MVP 2) to "Create Gmail Draft" button

---

## 6. Testing Additions

- Extension: manual test matrix across a handful of real LinkedIn and Indeed job postings (layouts vary — confirm the "largest visible text block" fallback works reasonably when the primary selector-based extraction misses)
- API token auth: a dedicated test confirming an extension-scoped token cannot access any endpoint beyond JD creation (least-privilege check, not just "does auth work")
- Gmail integration: confirm the OAuth scope requested is genuinely `gmail.compose` only, and add a test/manual check that no code path can escalate to actually sending — this is a "does the safety constraint hold," not just "does the feature work" test
- Kanban: confirm `submittedResumeId` correctly locks to the resume version that was current *at the time* the stage moved to "Applied," not whatever the latest version happens to be later (a v1→v2 regeneration shouldn't retroactively rewrite what you told a recruiter you submitted)

---

## 7. Explicitly Postponed (still out of scope)

- Automated/background JD scraping (kept out permanently per §0.1, not just deferred)
- Auto-send emails (kept out permanently per §0.2 — draft-only is a deliberate, standing constraint, not a stepping stone to auto-send)
- Multi-tenant billing/onboarding (Direction B, not chosen)
- Calendar integration for interview scheduling
- Mobile app / browser support beyond Chrome
