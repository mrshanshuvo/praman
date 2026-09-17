# Praman — MVP 2 Roadmap

MVP 1 is deployed and functionally complete, but real-JD testing surfaced one real anti-hallucination gap (unvalidated `summary` field). MVP 2 starts by closing that, then adds the highest-value postponed features from the MVP 1 roadmap (§12), in priority order. Nothing here should be built before the P0 fix.

---

## 0. P0 — Fix Before Anything Else: Summary Field Validation Gap

**The problem:** `Resume.summary` is free text with no `source*Id` mechanism, so nothing in the current validation pipeline can catch a fabricated claim inside it. Testing surfaced a concrete instance: a "top 4% on BeeCrowd" ranking appearing in a generated summary.

> **Clarification (post-audit):** The "top 4% on BeeCrowd" figure IS actually present in the seeded candidate profile (`personal.summary` in `seed.ts`), so it was not a hallucination in that run — it was an unverified claim that happened to be true. The gap is **structural**: the validator has no mechanism to confirm whether a number in `summary` is backed by the profile data, so it would pass a fabricated claim just as easily as a real one. The fix below closes that gap regardless.

**Fix, in order:**

1. **Prompt fix (cheap, do first):** Add an explicit constraint to `resume-generator.v1.ts`: *"The summary must not introduce any number, percentage, ranking, or superlative claim that does not appear verbatim in the Candidate Profile, Match Analysis, or Resume Strategy inputs. If no such figure exists, describe qualitatively without inventing one."*
2. **Structural fix (do next):** Extend `ResumeSchema` so `summary` isn't purely free text from the model's perspective — have the Resume Generator also output a `summaryClaims: string[]` array listing any factual claims (skills, achievements, numbers) it asserts in the summary, each with an optional `sourceRef`. This gives the validator something to check, the same way bullets have `sourceExperienceId`.
3. **Validator fix:** Add a check in `validation.service.ts` — regex-scan `summary` for numbers/percentages; for each match, confirm it appears in `summaryClaims` with a valid `sourceRef`, or reject/flag for retry if not. This is the same "flag numbers not traceable to source" logic already used for experience bullets (§8 in the MVP 1 roadmap) — the gap was that it was never applied to `summary`.
4. **Regression test:** Add a golden-file case specifically for this — a candidate profile with no notable metrics, run through the Resume Generator, asserting the output summary contains no invented numbers or rankings.
5. **Consistency check while you're in there:** also add a test asserting that a skill/experience marked `LEARNING` is described with equivalent hedging language regardless of which JD it's being tailored for (testing surfaced this varying across resumes — flat claim in some, correctly hedged "in a learning capacity" in others, for the identical underlying fact).

Do not proceed to section 1+ until this is fixed and the regression tests in step 4–5 pass on a fresh real-JD run.

---

## 0.5. Prompt Quality Pass — Do After P0, Before New Features

Real-JD testing (8 pipeline runs inspected post-audit) revealed the hallucination constraints in the prompts are working, but the **generation quality** has concrete, measurable gaps. Fix these before building new features — they affect every resume generated.

### Three concrete changes to `resume-generator.v1.ts`:

1. **Skills curation (highest impact):** The current prompt allows dumping the full candidate skill set (observed: 28 skills on a Frontend-focused resume that asked for React/Tailwind/shadcn). Add: *"Select 12–16 of the most relevant skills from `prioritizedSkills` in the Resume Strategy. Order core JD-matching skills first. Do NOT include skills not listed in `prioritizedSkills` or already deprioritized by the strategy."*

2. **Bullet reframing instruction:** Some bullets are thin paraphrases of the raw DB description without JD context (observed: `"Worked with the development team to improve usability..."` for a Frontend role). Add: *"For every bullet, reframe the candidate's actual action through the lens of what the target JD values. Use strong action verbs (Engineered, Architected, Implemented, Optimized, Automated). Do not invent metrics — describe the technical action precisely."*

3. **Narrative guidance as primary directive:** `resumeStrategy.narrativeGuidance` is passed as input but the prompt never instructs the AI to treat it as the primary writing lens. Add: *"Treat `resumeStrategy.narrativeGuidance` as the primary writing directive for this resume. Every section — summary, bullets, skill ordering — must reflect the framing and emphasis it describes."*

### What to leave alone:
- Do **not** add a rigid per-section bullet count rule — it makes the AI count instead of write.
- Do **not** enforce a 3-sentence summary formula — the adaptive summaries generated across 8 runs are already good; rigidity here would hurt quality.

### Regression check after this change:
Re-run the same Frontend JD (Run #8's JD) and compare: skill count should drop to ≤16 JD-relevant skills, and the Zensoft intern bullet should read with more specificity than the previous run.

---

## 1. Priority Order for Remaining MVP 2 Features

Ranked by value-to-effort for a solo user actually applying to jobs:

1. **PDF/HTML resume rendering** — highest value: turns "a validated JSON blob" into "a document you can actually submit." Do this first among new features.
2. **Resume version history** — low effort, high practical value once you're generating multiple tailored resumes per JD or re-running after profile updates.
3. **Numeric match score** — only after the explainable-conclusion version (already in MVP 1) has proven trustworthy across enough real JDs; keep it as a secondary, clearly-labeled "rough estimate," not a replacement for the explanation.
4. **Cover letter generation** — same anti-hallucination architecture as the resume generator; reuse most of the pipeline pattern.
5. **Auth / multi-user** — only if you actually want others using it; skip entirely if this stays personal-use.
6. Job board scraping, multi-LLM routing, analytics — genuinely postpone further; low value relative to effort for a single user.

---

## 2. PDF/HTML Resume Rendering

**Approach:** template-based HTML → PDF, not a WYSIWYG editor. Keep it deterministic — the LLM already did its job producing the validated Resume JSON; this stage should involve zero AI calls.

- Add a `ResumeTemplate` concept: 1–2 clean HTML/CSS templates (e.g. "Classic ATS-friendly", "Modern") that take the `ResumeSchema` JSON and render it via a templating approach (React server-side render to HTML, or a simple handlebars-style template).
- PDF generation: render the HTML then convert with a headless browser (Puppeteer/Playwright) or a PDF library (e.g. `@react-pdf/renderer` if you want to build templates as React components directly).
- New endpoint: `GET /job-descriptions/:id/resume/pdf?template=classic` → streams a PDF.
- Frontend: add a "Download PDF" button on `/jobs/[id]/resume`, plus a simple template picker if you build more than one.
- Keep the ATS-friendliness constraint from the original problem statement in mind: avoid multi-column layouts, text-in-images, or complex tables in the template — plain semantic structure parses better through ATS systems.

**New DB additions:** none required — PDFs can be generated on-demand from the existing `Resume.resumeJson`, no need to store the rendered file unless you want caching.

---

## 3. Resume Version History

- Currently `Resume` has a 1:1 relation to `ResumeStrategy`. Change to 1:many so re-running the pipeline for the same JD creates a new `Resume` row instead of overwriting.
- Add `version: Int @default(1)` and `isLatest: Boolean @default(true)` (or just order by `createdAt`) to `Resume`.
- Frontend: on `/jobs/[id]/resume`, add a simple version selector/history list so you can compare a resume generated today against one from a week ago after profile edits.
- This is mostly a schema + UI change — no new AI logic needed.

> **Migration note (post-audit):** The current `resume.service.ts` already upserts — it updates the existing `Resume` row if one exists for the strategy, rather than creating a new one. Version history therefore requires: (1) a DB migration removing the 1:1 uniqueness constraint on `resumeStrategyId`, (2) updating the service to always `create` instead of upsert, and (3) a query change on the frontend to fetch the latest record rather than assuming a single row.

---

## 4. Numeric Match Score (deferred gate)

Only build this once you've run enough real JDs through MVP 1 + the P0 fix to trust the explainable conclusion. When you do:

- Do **not** have the LLM invent the score directly — compute it deterministically from the structured `MatchAnalysis` output (e.g. weighted count of `strongMatches` vs `mustHave` requirements, `missingSkills` count, etc.). This keeps the score auditable and consistent with the explanation, rather than being a second independent (and potentially inconsistent) LLM judgment.
- Display it as a secondary signal next to the explanation text, never in place of it — the original reasoning for avoiding a bare score (arbitrary-feeling, not explainable) still applies; a computed, transparent score sidesteps that as long as the computation is visible/inspectable, not a black box.

---

## 5. Cover Letter Generation

Reuses the existing architecture pattern almost exactly:

- New `CoverLetterModule` + `cover-letter-generator.v1.ts` prompt, same constraints as the Resume Generator (no invented experience, traceable claims, no overstated skill levels).
- Input: Candidate Profile + Structured JD + Match Analysis + Resume Strategy (same inputs as Resume Generator) plus the already-generated Resume JSON, so the letter doesn't contradict the resume.
- Output schema: simple — `{ paragraphs: string[], claimRefs: string[] }` with the same source-traceability pattern as the resume's `sourceExperienceId` fields.
- Validation: same evidence cross-check pattern as §8/P0 above — extend the validator to also check cover letter claims, don't build a separate validation path.
- New endpoint: `POST /job-descriptions/:id/cover-letter`.

---

## 6. Auth / Multi-User (only if needed)

Skip unless you actually want other people using this. If you do:

- Add real auth (e.g. NextAuth/Auth.js on the frontend, JWT validation on the NestJS side) replacing the hardcoded seeded user.
- Every existing model already has a `userId` foreign key path through `CandidateProfile`/`User` — the schema doesn't need much rework, mainly the API layer needs request-scoped user context (guards/interceptors in NestJS) instead of the single hardcoded user.
- This is a meaningfully larger chunk of work than everything else in this document — don't take it on unless there's a real reason to.

---

## 7. Explicitly Still Postponed

- Job board scraping/auto-import of JDs
- Multi-LLM provider routing or fallback
- A second "critic" LLM validation pass (deterministic validation is working and more auditable — don't add LLM-based validation until deterministic checks are clearly insufficient)
- Analytics/trends across JDs and gaps over time
- WYSIWYG resume editing in the UI (template-based rendering is enough for MVP 2)

---

## 8. Suggested Build Order for MVP 2

1. P0 fix (§0) — prompt + schema + validator + regression tests, verified against a fresh real-JD run
2. Prompt quality pass (§0.5) — 3 targeted changes to `resume-generator.v1.ts`, regression-verified against a real re-run
3. Resume version history (§3) — schema migration + service change + frontend selector
4. PDF/HTML rendering (§2) — the actual "can I submit this" milestone
5. Cover letter generation (§5) — same architecture pattern, moderate new surface area
6. Numeric match score (§4) — only after P0 has been trusted across several more real JDs
7. Auth — only if/when there's a real need for multiple users
