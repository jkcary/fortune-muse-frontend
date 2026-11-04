# Free discovery and returning stories — 2026-11-03

The question page now opens directly into the immersive Selene conversation, with speech input/output and an editable six-field information review before the existing coin ritual. The separate quick-question interface has been removed at the user's request. No cast is created until the user confirms their question.

The completed reading begins with a free short AI reflection tied to the actual question, context and immutable hexagram. Two original SVG doors reveal different perspectives, tradeoffs and small experiments. Users may explore either, reject both, give relevance feedback, and write their own action. The $2.99 deep interpretation and two paid follow-ups remain separate.

Keeping a step as a guest stores it only in the reading's existing session/24-hour lifetime. For a signed-in user, **Keep this step & follow my story** explicitly saves a non-temporary reading to the journal and enables a return card. The homepage and journal display a small constellation made only from real saved stories. Users can append progress, wait, pause or resume. This does not enable AI memory, send notifications, start a subscription, or schedule reminders.

## Backend contract

Apply additive migration `012_story_experience.sql` before deploying the new backend. It adds nullable `glimpse_json` and `journey_json`; legacy records remain valid. Both fields are included in account export and removed with the reading or its account. Existing expiry cleanup applies to guest/temporary content.

- `POST /oracle/casts/:id/glimpse`, `{language}`: access-controlled, requires all six lines, uses the configured `intake` AI task, and caches the successful result once per cast. Refreshing or changing language does not reroll or regenerate it. Attribution and generation language accompany the saved result. Offline/provider/validation failures return labelled editorial prompts without caching them, allowing an explicit retry. Same-process requests coalesce; a PostgreSQL session advisory lock excludes parallel workers for one cast. Free generation is capped at three concurrent casts per process, leaving connection capacity for regular API requests and paid work. Route rate limits also apply.
- `PATCH /oracle/casts/:id/journey`: accepts selected door, relevance feedback, action, follow-up opt-in, status and/or one UUID-keyed progress update. A row lock merges updates. Repeating an identical update ID is idempotent; a conflicting reuse is rejected. Up to 20 updates per story, 400 characters per action and 600 per progress entry. Only explicit signed-in follow-up opt-in claims a guest cast and removes expiry; temporary/private casts cannot opt in.
- Cast responses include `updatedAt`. Reading reloads and the new UI preserve newer state when an older response arrives late.

The four interface languages are maintained. User-authored text and saved AI content keep their original language. AI input excludes journal history and memory; the prompts prohibit invented personal details, factual forecasts and irreversible advice. Schema/content checks and visibly attributed editorial fallbacks remain required.

## Validation

Backend tests cover free guest access, successful cache/coalescing, all four language prompts/fallbacks, invalid/provider responses, ownership, incomplete/expired casts, concurrency capacity, actions and idempotent progress, explicit claiming, private mode, pausing, account export and deletion. Browser QA exercises a real configured AI response for a synthetic two-job-offer question, guest action/progress persistence, signed-in return, phone layout and reduced motion. Generated screenshots live under ignored `output/playwright/story-*` paths. Synthetic development records are cleaned up after QA.

Technical validation does not establish improved retention or a 60–90 second first-value time. Those remain product hypotheses to measure with real users. Social features, public rooms, streaks, notifications and a full Life Atlas are outside this iteration. Native resource export checks packaging, not signed installation or device microphone/audio behaviour.

Final checks: 100 backend tests passed, both TypeScript checks and contract synchronization passed, backend compilation passed, and Web/iOS/Android resource exports passed. Browser checks also covered back/edit confirmation, provider-network retry and labelled editorial fallback with controlled responses, guest progress surviving refresh, explicit signed-in claiming, pause/resume and return cards. The outer app clips its decorative backdrop so it no longer creates a white overscroll area on short mobile screens.
