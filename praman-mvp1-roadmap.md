# Praman — MVP 1 Implementation Roadmap

Goal: end-to-end pipeline — JD → JD Analysis → Candidate/JD Match → Resume Strategy → Resume JSON → Validated Resume JSON — reliable and truthful, minimal infra.

---

## 1. Exact MVP Scope

**In scope:**

- Single-user (no auth complexity needed yet — a hardcoded/default user or simple email login is enough)
- One candidate profile (CRUD)
- Paste one JD → run full pipeline → get validated Resume JSON
- Four AI modules run as separate calls (not one mega-prompt)
- Zod validation + evidence-based anti-hallucination check on final resume JSON
- View past JD analyses/resumes for the same candidate

**Explicitly out of scope for MVP 1** (see also section 12):

- Multiple candidate profiles / multi-tenant auth
- PDF/HTML resume rendering
- Job board scraping/integration
- Numeric match scoring
- Fine-tuning / RAG / vector search
- Cover letter generation
- Multi-LLM routing or fallback providers

---

## 2. Database Schema (PostgreSQL + Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  profile   CandidateProfile?
}

model CandidateProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  personal    Json      // name, location, contact, links
  educations  Education[]
  experiences Experience[]
  projects    Project[]
  skills      Skill[]
  certifications Certification[]
  updatedAt   DateTime @updatedAt
}

model Education {
  id                 String @id @default(cuid())
  candidateProfileId String
  candidateProfile   CandidateProfile @relation(fields: [candidateProfileId], references: [id])
  institution String
  degree      String
  field       String?
  startDate   DateTime?
  endDate     DateTime?
  details     String?
}

model Experience {
  id                 String @id @default(cuid())
  candidateProfileId String
  candidateProfile   CandidateProfile @relation(fields: [candidateProfileId], references: [id])
  company     String
  title       String
  startDate   DateTime?
  endDate     DateTime?
  isCurrent   Boolean  @default(false)
  responsibilities String[] // bullet-level facts, atomic and verifiable
  technologies String[]
  achievements String[]     // must include only real, candidate-confirmed metrics
}

model Project {
  id                 String @id @default(cuid())
  candidateProfileId String
  candidateProfile   CandidateProfile @relation(fields: [candidateProfileId], references: [id])
  name        String
  description String
  technologies String[]
  role        String?
  outcomes    String[]
  link        String?
}

model Skill {
  id                 String @id @default(cuid())
  candidateProfileId String
  candidateProfile   CandidateProfile @relation(fields: [candidateProfileId], references: [id])
  name        String
  level       SkillLevel
  evidence    String?  // e.g. "used in Project X", "3 yrs at Company Y"
}

enum SkillLevel {
  EXPERIENCED
  WORKING_KNOWLEDGE
  LEARNING
  NOT_LEARNED
}

model Certification {
  id                 String @id @default(cuid())
  candidateProfileId String
  candidateProfile   CandidateProfile @relation(fields: [candidateProfileId], references: [id])
  name        String
  issuer      String?
  date        DateTime?
}

model JobDescription {
  id          String   @id @default(cuid())
  userId      String
  rawText     String
  structured  Json     // JDAnalysis output, see §6
  createdAt   DateTime @default(now())
  analysis    CandidateJdAnalysis?
}

model CandidateJdAnalysis {
  id               String  @id @default(cuid())
  jobDescriptionId String  @unique
  jobDescription   JobDescription @relation(fields: [jobDescriptionId], references: [id])
  result           Json    // see §6
  strategy         ResumeStrategy?
}

model ResumeStrategy {
  id                     String @id @default(cuid())
  candidateJdAnalysisId  String @unique
  candidateJdAnalysis    CandidateJdAnalysis @relation(fields: [candidateJdAnalysisId], references: [id])
  result                 Json   // see §6
  resume                 Resume?
}

model Resume {
  id                String @id @default(cuid())
  resumeStrategyId  String @unique
  resumeStrategy    ResumeStrategy @relation(fields: [resumeStrategyId], references: [id])
  resumeJson        Json
  validationReport  Json     // schema + evidence-check results
  status            ResumeStatus @default(DRAFT)
  createdAt         DateTime @default(now())
}

enum ResumeStatus {
  DRAFT
  VALIDATED
  REJECTED
}
```

Keep `structured`/`result`/`resumeJson` as `Json` columns validated by Zod at the application layer rather than modeling every nested field relationally — this avoids painful migrations while the shapes are still evolving.

---

## 2a. Project Structure — Turborepo Monorepo

Decision: separate Next.js frontend and NestJS backend apps, in a Turborepo monorepo, sharing Zod schemas/types through a package — not a Next.js-only monolith.

```
praman/
├── apps/
│   ├── web/          (Next.js + TypeScript + Tailwind + shadcn/ui)
│   └── api/          (NestJS + TypeScript + Prisma)
├── packages/
│   └── schemas/      (@praman/schemas — all Zod schemas + inferred types from §6)
├── turbo.json
└── package.json
```

- `packages/schemas` is the single source of truth for `StructuredJdSchema`, `MatchAnalysisSchema`, `ResumeStrategySchema`, `ResumeSchema`, etc. Both `apps/api` (validation) and `apps/web` (typing API responses) import from it — no manual syncing.
- CORS (NestJS) + `NEXT_PUBLIC_API_URL` (Next.js) are the only new integration points versus a monolith; no gateway/proxy needed for MVP 1.
- This replaces "one LLM provider initially" as the only backend-adjacent stack change — Prisma/Postgres/Zod choices from the original architecture direction are unaffected, they just now live inside `apps/api`.

---

## 3. Backend Modules (NestJS)

- `CandidateModule` — profile CRUD (personal, education, experience, projects, skills, certs)
- `JobDescriptionModule` — create/fetch JDs, trigger JD analysis
- `MatchModule` — runs Candidate↔JD analysis given a JD + profile
- `StrategyModule` — runs Resume Strategy given analysis
- `ResumeModule` — runs Resume Generator, then validation
- `AiModule` — thin wrapper around the LLM provider (single client, shared retry/timeout/logging), injected into the four modules above; **no business logic here**
- `ValidationModule` — Zod schemas + evidence-cross-check logic, shared by ResumeModule (and optionally MatchModule/StrategyModule outputs)
- `PipelineModule` (optional orchestrator) — exposes one endpoint that chains the four steps for convenience, but each step must also be independently callable/testable

---

## 4. API Endpoints

```
# Candidate profile
GET    /candidate-profile
PUT    /candidate-profile
POST   /candidate-profile/experiences
PUT    /candidate-profile/experiences/:id
DELETE /candidate-profile/experiences/:id
POST   /candidate-profile/projects
PUT    /candidate-profile/projects/:id
DELETE /candidate-profile/projects/:id
POST   /candidate-profile/skills
PUT    /candidate-profile/skills/:id
DELETE /candidate-profile/skills/:id
... (same pattern for education, certifications)

# Job description + pipeline
POST   /job-descriptions              # { rawText } -> creates JD + runs JD Analyzer -> returns structured JD
GET    /job-descriptions/:id
POST   /job-descriptions/:id/match    # runs Candidate<->JD analysis -> returns result
POST   /job-descriptions/:id/strategy # runs Resume Strategy -> returns result
POST   /job-descriptions/:id/resume   # runs Resume Generator + validation -> returns Resume JSON + report
GET    /job-descriptions/:id/resume   # fetch latest generated resume

# Convenience
POST   /job-descriptions/:id/run-pipeline   # runs match -> strategy -> resume in one call
```

Keeping each stage as its own endpoint (rather than only the combined pipeline endpoint) lets you inspect/debug/re-run any single stage — important while prompts are still being tuned.

---

## 5. AI Pipeline

```
[Candidate Profile (DB)]        [Raw JD text]
         │                            │
         │                     JD Analyzer (LLM call 1)
         │                            │
         │                     Structured JD (JSON)
         │                            │
         └──────────► Candidate Matcher (LLM call 2) ◄────┘
                              │
                    Candidate↔JD Analysis (JSON)
                              │
                     Resume Strategy (LLM call 3)
                              │
                     Resume Strategy (JSON)
                              │
         ┌────────────────────┴─────────────────────┐
         │                                           │
  Candidate Profile (DB)                     Resume Strategy + Structured JD
         │                                           │
         └──────────► Resume Generator (LLM call 4) ◄┘
                              │
                       Resume JSON (draft)
                              │
                 Zod Schema Validation + Evidence Cross-Check
                              │
                    Approved Resume JSON  (or rejection + diff report)
```

Each stage is a separate LLM call with its own system prompt, input schema, and output schema. No stage receives the raw JD text again once it has been structured — later stages only see structured JSON, which reduces prompt drift and keeps context small.

---

## 6. JSON Schemas (Zod, sketch)

```ts
// Structured JD
const StructuredJdSchema = z.object({
  jobTitle: z.string(),
  seniority: z.string().optional(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  yearsOfExperience: z.string().optional(),
  responsibilities: z.array(z.string()),
  educationRequirements: z.array(z.string()).optional(),
  locationOrWorkMode: z.string().optional(),
  salary: z.string().optional(),
  mustHave: z.array(z.string()),
  niceToHave: z.array(z.string()),
  otherNotes: z.array(z.string()).optional(),
});

// Candidate <-> JD Analysis
const MatchAnalysisSchema = z.object({
  strongMatches: z.array(z.string()),
  partialMatches: z.array(z.string()),
  missingSkills: z.array(z.string()),
  experienceGaps: z.array(z.string()),
  educationGaps: z.array(z.string()),
  relevantExperience: z.array(z.string()), // references to Experience.id
  relevantProjects: z.array(z.string()), // references to Project.id
  emphasize: z.array(z.string()),
  doNotClaim: z.array(z.string()),
  explanation: z.string(), // explainable conclusion, no score
});

// Resume Strategy
const ResumeStrategySchema = z.object({
  emphasizedExperienceIds: z.array(z.string()),
  emphasizedProjectIds: z.array(z.string()),
  prioritizedSkills: z.array(z.string()),
  gaps: z.array(z.string()),
  forbiddenClaims: z.array(z.string()),
  narrativeGuidance: z.string(), // free-text guidance for tone/angle
});

// Resume JSON (MVP 1 output)
const ResumeSchema = z.object({
  personal: z.object({ name: z.string(), contact: z.record(z.string()) }),
  summary: z.string(),
  experience: z.array(
    z.object({
      sourceExperienceId: z.string(), // MUST map to a real Experience.id
      company: z.string(),
      title: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
  projects: z.array(
    z.object({
      sourceProjectId: z.string(), // MUST map to a real Project.id
      name: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
  skills: z.array(z.string()),
  education: z.array(z.object({ sourceEducationId: z.string() })),
  certifications: z.array(z.object({ sourceCertificationId: z.string() })).optional(),
});
```

The `sourceExperienceId` / `sourceProjectId` / etc. fields are the key anti-hallucination hook — see §8.

---

## 7. Prompt Architecture

- **One system prompt per stage**, versioned as a constant/file (not inline strings scattered in services) — e.g. `prompts/jd-analyzer.v1.ts`.
- Each prompt states: role, exact input JSON shape, exact output JSON shape, and hard constraints.
- For the Resume Generator specifically, the system prompt must explicitly say:
  - "You may only use facts present in the provided Candidate Profile, Match Analysis, and Resume Strategy."
  - "Every bullet must be traceable to a `sourceExperienceId` or `sourceProjectId` that exists in the input."
  - "Do not invent metrics. If no metric exists, describe the action without a number."
  - "If asked to imply a skill level higher than the profile states (e.g. profile says LEARNING), do not do so."
- Use **structured output / forced JSON mode** if your provider supports it (e.g. tool-calling with a JSON schema, or response_format json) rather than relying on the model to "just return JSON" — reduces parsing failures.
- Keep prompts stateless: each call gets only what it needs (JD Analyzer never sees candidate profile; Resume Generator never sees raw JD text, only structured JD).

---

## 8. Validation / Anti-Hallucination Strategy

Two layers, both mandatory before a resume is marked `VALIDATED`:

1. **Schema validation** — Zod parse of the Resume JSON. Reject/retry on shape mismatch.
2. **Evidence cross-check** (deterministic code, not another LLM call, for MVP 1):
   - Every `sourceExperienceId` / `sourceProjectId` / `sourceEducationId` / `sourceCertificationId` must exist in the candidate's actual profile records.
   - Every skill listed in `skills` must exist in `CandidateProfile.skills` (name match, case-insensitive) — reject any skill not present.
   - Skills with level `NOT_LEARNED` must never appear.
   - Optionally: a lightweight token/substring check that flags resume bullets containing numbers not present in the corresponding source experience/project bullets (numbers are the highest-risk hallucination surface — flag for manual review rather than silently rejecting, since some rewording of an existing number is legitimate).
   - Store the validation outcome in `Resume.validationReport` regardless of pass/fail, so failures are inspectable.
3. On failure: don't silently discard — return the draft plus a diff report to the user/UI, and optionally allow one automatic re-generation attempt with the violation list appended to the prompt as a correction instruction.

This keeps anti-hallucination enforcement deterministic and auditable rather than trusting a second LLM call to police the first.

---

## 9. Frontend Pages/Components (Next.js + shadcn/ui)

- `/profile` — candidate profile editor (sectioned forms: personal, education, experience, projects, skills w/ level selector, certifications)
- `/jobs` — list of pasted JDs with status (analyzed / matched / strategized / resume ready)
- `/jobs/new` — paste JD textarea → submit → shows structured JD result
- `/jobs/[id]` — tabbed view: Structured JD | Match Analysis | Resume Strategy | Resume JSON, each tab showing that stage's JSON in a readable card layout, with a "Run this step" button per stage
- `/jobs/[id]/resume` — final Resume JSON viewer + validation report (pass/fail badges per check)
- Shared components: `SkillLevelBadge`, `JsonCard` (collapsible pretty-printer), `ValidationReportPanel`, `PipelineStepper` (shows the 4-stage progress)

---

## 10. Recommended Implementation Order

1. Scaffold the Turborepo monorepo (`apps/web`, `apps/api`, `packages/schemas`) per §2a; confirm `turbo dev` runs both apps and a placeholder NestJS endpoint is reachable from Next.js (CORS + env wired)
2. Prisma schema + migrations, seed script with your own real profile data
3. `CandidateModule` CRUD + `/profile` frontend page (get real data in before touching AI)
4. `AiModule` (LLM client wrapper only — no prompts yet), confirm you can round-trip a trivial JSON call
5. JD Analyzer: prompt + Zod schema + endpoint + minimal `/jobs/new` UI — validate this stage alone with 3–5 real JDs
6. Candidate Matcher: prompt + schema + endpoint — test against the seeded profile
7. Resume Strategy: prompt + schema + endpoint
8. Resume Generator: prompt + schema + endpoint
9. Evidence cross-check validator (this is the module to spend the most care on)
10. `/jobs/[id]` tabbed UI wiring all four stages together + `run-pipeline` convenience endpoint
11. Manual end-to-end test with 5–10 real job descriptions you're actually considering applying to

---

## 11. Testing Strategy

- **Unit tests**: Zod schemas (valid/invalid fixtures), evidence cross-check logic (this is pure, deterministic code — easiest and most valuable to test thoroughly)
- **Golden-file tests per AI stage**: for each of the 4 prompts, keep a small fixed set of (input → expected-shape output) fixtures; assert schema validity and key field presence (not exact text, since LLM output varies) on every prompt change
- **Anti-hallucination regression tests**: deliberately craft candidate profiles with gaps (e.g., a skill at `LEARNING` level, no metrics anywhere) and assert the generated resume never claims more — this is your most important test suite given the project's core promise
- **Integration test**: one real JD run through the full pipeline end-to-end, asserting a `VALIDATED` resume with all `source*Id` fields resolvable
- Manual review loop: since LLM output quality can't be fully unit-tested, keep a running log of real JDs run through the pipeline with pass/fail judgment, to catch prompt regressions over time

---

## 12. Postpone to MVP 2+

- HTML/CSS resume templates + PDF export
- Numeric match scoring (only after the explainable-conclusion version is trusted)
- Multi-candidate / multi-user auth and permissions
- Cover letter generation
- Job board scraping or auto-import of JDs
- LLM-based (rather than deterministic) evidence validation, or a second "critic" LLM pass
- Support for multiple LLM providers / fallback routing
- Resume version history / diffing across multiple tailored versions for the same JD
- Analytics (which JDs/skills come up most often, gap trends over time)
