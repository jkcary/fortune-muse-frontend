# ORACLE ONE — implementation and handover

Working brand for the FATE MATRIX 2.0 refactor. Existing application identifiers, OAuth callbacks, user accounts and legacy reading IDs remain compatible.

## Implemented

- Responsive dark interface: Explore, question, coin ritual, interpretation, journal, sign-in, account, method, sample and delivery operations.
- Original procedural SVG coin artwork with unique gradients, subtle movement and reduced-motion support. No external stock imagery or image-generation dependency.
- Server-authoritative three-coin casting: six ordered rounds, 2/3 face values, King Wen hexagrams, moving lines and transformed hexagram. Recorded basis is immutable across paid interpretation and follow-ups.
- Complete free cast with original editorial meanings for all 64 hexagrams. English meanings are newly authored modern reflections, not literal ancient line translations.
- Optional $2.99 deep reading, two bounded follow-up questions, existing voucher and complimentary account support. No subscription.
- Paid delivery jobs committed with payment confirmation, PostgreSQL row leases, session advisory locks, heartbeat, retries, dead-worker recovery and refund jobs.
- Stripe checkout idempotency, signed webhook verification, amount/currency/session checks and asynchronous refund tracking. Local test payment remains development-only.
- Private journal with search, topic filters, favorites and user notes. Guest readings can be claimed by their owner after signing in.
- Guest/temporary casts expire after 24 hours. Periodic cleanup deletes personal content and queues a refund for undelivered paid content; financial records remain separate.
- New accounts default to memory off. Journal notes and explicitly shared memory remain separate.
- Web exports a 1080 × 1920 PNG using public card fields only. Native renders the same SVG to a PNG and uses the system share sheet; native device acceptance remains pending.
- User export includes v2 casts, follow-ups and legacy intake transcripts.
- Administrator delivery overview and audited retries for failed jobs.

## Existing data and migration

Frontend and backend are separate Git repositories. Existing spirit illustrations and seed changes were not reset.

Migration 009_oracle_one.sql is additive. It creates casts, follow-ups and delivery jobs, tracks the exact voucher consumed by an order, changes defaults for new accounts, and recovers pending paid legacy deliveries. Existing preferences and results remain intact. Old results are not assigned invented hexagrams.

Migration 010_refund_tracking.sql tracks provider refund IDs and pending/succeeded/failed refund status. Pending refunds are not presented as completed.

Back up the database before deployment. Apply migrations as a release step, then start the API; the development entry point also applies them automatically. Keep additive tables if rolling application code back.

## New API

| Endpoint | Behavior |
|---|---|
| GET /oracle/catalog | Rules, 64 hexagrams, current price |
| POST /oracle/prepare | Age-confirmed, stateless conversation with Selene; up to four user answers, four languages, no account required |
| POST /oracle/casts | Age-confirmed reading with idempotent client ID |
| GET /oracle/casts/:id | Resume through account ownership or guest capability |
| POST /oracle/casts/:id/rounds | Record next round or finish remaining rounds |
| PATCH /oracle/casts/:id | Claim/save reading, note or favorite |
| DELETE /oracle/casts/:id | Delete personal reading content |
| POST /oracle/casts/:id/upgrade | Reuse pending purchase or create one |
| POST /oracle/casts/:id/cancel-checkout | Expire/cancel pending checkout |
| POST /oracle/casts/:id/followups | Idempotent, limited follow-up requests |
| GET /oracle/journal | Account-owned, non-temporary readings |
| GET /oracle/admin/overview | Admin delivery status |
| POST /oracle/admin/jobs/:id/retry | Audited retry of eligible failed delivery |

Guest capabilities use session storage on web and secure storage on native; only token hashes enter PostgreSQL. Tokens travel in a redacted header, never in a URL. Claimed readings require account ownership.

## Run and verify

Backend commands: npm install; npm run dev; npm run typecheck; npm test; npm run build.

Frontend commands: npm install; npm run web; npm run typecheck; npm run build:web.

Tests require a separate PostgreSQL database ending in _test. The helper refuses to reset another database. The default is fortune_muse_test. Never run a development or production API against the test database.

The backend build uses a portable Node script. SQL files are copied individually, avoiding the native recursive copy that crashed Node on this Windows host.

## Validation

Final run: 89 backend tests passed; frontend/backend type checks, contract synchronization check, backend build, Web export, iOS resource export and Android resource export passed. These resource exports are not signed native app builds. Browser checks cover desktop and mobile layouts.

- Engine tests enumerate all 4096 valid six-line combinations; anchors cover hexagrams 1, 2, 46, 63 and 64.
- API tests cover concurrent/retried rounds, ownership, memory defaults, journal privacy, checkout/payment idempotency, follow-up limits, worker recovery, voucher refunds and expiry.
- Existing API, AI, generator, intake, memory, chat and account tests remain; legacy memory/chat tests explicitly opt in.
- Browser checks cover desktop/mobile, guest casting, refresh/resume, sign-in return, local checkout, real configured AI interpretation, notes, favorites and PNG export.
- Screenshots and export examples are in frontend/output/playwright.

## Release boundaries

- ORACLE ONE remains a working name; trademark/domain availability has not been established.
- Cultural review, operator-specific legal review, provider retention settings, real Stripe test-mode webhook exercises and native device acceptance remain before public launch.
- Native store billing and submission are not implemented by browser checkout. Bundle identifiers remain unchanged.
- Subscriptions, full Life Atlas star map, advanced Na Jia rules and redesigned social rooms remain later-phase work from the agreed plan.
- Original character assets and legacy features remain through legacy routes. Some utility screens retain their former layout.
- The core experience supports American English, British English, Simplified Chinese and Traditional Chinese. Previously saved AI readings and user-authored questions/notes retain their original language. Legacy utility/legal content retains its existing translation coverage.
- Backup and AI-provider copies follow deployed retention policies. Application deletion does not claim immediate deletion from every third-party or backup system.

Current dependency audit: 14 advisories, including 2 high. The full report is frontend/output/npm-audit-oracle.json. Existing Expo build-tool dependencies are involved; no incompatible SDK downgrade or forced major update was applied. Dependency remediation is part of the release review.

## Pearl and celestial interface update — 2026-11-02

- Followed the requested art direction: luminous nacre spheres, rose/violet nebulae, gold orbital filigree, celestial symbols and theatrical serif typography. Responsive SVG artwork is authored in code, with reduced-motion support; no stock imagery or new runtime dependency.
- Profile and Settings now share one complete account screen: four-language selection, avatar editing, email status, memory preferences and management, same-question rooms, reading receipts, journal, voucher balance, timezone/country, data export, privacy requests, support/legal links, sign-out and password/DELETE-confirmed account deletion. Admin operations remain role-restricted.
- Language changes update the interface immediately, persist locally and sync to the signed-in account. Account hydration does not write stale preferences back. Save failures expose a retry action. Guests can choose their language without signing in.
- The shared navigation places the four-language dropdown immediately to the right of Sign in / My account, with matching transparent pill styling. New visitors default to English US regardless of browser language; saved device/account choices take precedence. Narrow screens use two navigation rows, keeping account and language controls together. Web uses a native select; native clients use a modal picker.
- Added Simplified/Traditional translations for the core reading journey, all 64 editorial hexagram names/meanings and public share cards. British English uses appropriate spelling. Dates follow the chosen locale; billing remains USD.
- New premium interpretations and follow-ups use the account language, with explicit four-locale generation rules. Added an integration test covering preference persistence and generated output for every locale. Existing casts are not regenerated when the language changes.
- Browser validation includes authenticated language persistence after reload, both settings routes, memory/room switches, Chinese question-to-reading completion, Chinese PNG export and narrow-screen account layout. Synthetic local QA account is removed after validation.

## Selene conversational preparation

- Added an original fictional AI guide portrait, generated using the built-in imagegen tool. The asset and exact prompt are in `frontend/assets/images/oracle-guide-selene.png` and `oracle-guide-selene.prompt.md`. The question page displays a large portrait on desktop and a compact portrait in the conversation header on mobile.
- The optional conversation uses the existing configured `intake` AI provider. Selene acknowledges the actual question and asks a concise follow-up before any hexagram exists. The user may proceed to information review at any time; explicit confirmation and saving are now required before a new cast is created. Four user answers is the upper limit.
- Requires explicit 18+ confirmation before sending to AI. Screens incoming and generated content, bounds transcripts, rate-limits anonymous calls, and treats all transcript roles as untrusted data. Provider failures show a retry; the configured offline mock is explicitly labelled as scripted guidance.
- Preparation transcripts remain in page memory and are not persisted in PostgreSQL. Only the user's initial question and successful, user-authored additional context accompany the cast; generated assistant claims are never copied into cast context. Existing temporary-reading behaviour applies after casting.
- Language switching covers greetings, controls and newly generated responses; previous responses retain the language in which they were produced. Topic changes or a new suggested question reset the conversation and cancel any pending request.
- Validation: 72 backend tests passed, including consent, guest access, four locales, transcript limits, content interception, provider failure and genuine-model attribution. Browser checks exercised the configured AI with a career question and verified that the user's mentoring/growth context reached the casting form unchanged. Web and native resource exports are checked separately from signed device builds.

## Immersive encounter and review confirmation

- Replaced the bubble-based question form with a central, transparent character stage. Three original Selene cutouts support listening, thinking and speaking poses, with subtle breathing/float motion, flowing user words behind the figure, current-question subtitles and an optional transcript. Reduced-motion settings stop continuous motion.
- Microphone input uses the existing recognition adapter. Recording is initiated explicitly, can be stopped or cancelled, times out at 60 seconds, and produces editable text before sending. Starting the microphone interrupts voice playback. Permission failures and unsupported browsers retain text input. Optional speech output uses Expo Speech; voice quality/availability is device-dependent.
- A completed conversation automatically opens an editable review card. The user may also enter review early, including unsent text. The original free-text background has subsequently been replaced with the AI-organised fields described below. Editing does not create a reading. Only the explicit Confirm & save action creates a cast and navigates to the coin ritual; no coins have been tossed at that point.
- Migration 011_review_confirmation.sql adds a nullable information_confirmed_at timestamp. Existing readings remain compatible. POST /oracle/casts now requires informationConfirmed=true; new confirmations are recorded at creation. A retry reuses its identity only while the reviewed contents remain unchanged.
- Validation: 73 backend tests passed. Browser checks verified live AI clarification, edited information saved verbatim, confirmation timestamp present, zero rounds before casting, and synthetic-record cleanup. Simulated speech recognition covered listening, transcription editing and automatic review transition; simulated playback exercised voice callbacks. Actual microphone/voice quality and native device acceptance remain device checks. Web, iOS and Android resource exports passed.
- Original pose assets and complete imagegen edit prompts are documented in frontend/assets/images/oracle-guide-selene.prompt.md.

## Structured information review — 2026-11-02

- Added stateless POST /oracle/review using the configured intake AI provider. It extracts only the user's question and background into current situation, main concern, desired outcome, time frame, notes and additional information. All six keys are required; unknown details remain empty. Prompts preserve negation, uncertainty and proposed versus agreed arrangements, and treat user content as untrusted data. The endpoint requires adult confirmation, screens input, limits length and request rate, and does not create a cast.
- Replaced the background textarea with editable key/value rows in all four locales. The original background is available in a disclosure. Inputs expand for long content; mobile stacks the stage and card without overlapping later sections. Fields remain locked while AI organises the source, and casting stays disabled until that request finishes.
- AI failure retains original background in Additional information with a clear recovery message, manual editing and retry. Returning to the conversation and reopening unchanged review retains edited values without regenerating them. Abort and request-identity checks discard stale results after leaving or resetting the review.
- Confirm & save serialises the reviewed non-empty values as labelled lines, within the existing 1200-character context limit. Only this edited version is saved; assistant dialogue and original background are not silently appended. The cast still requires informationConfirmed=true and begins with zero coin rounds.
- Validation: 81 backend tests passed, including fixed-key/locale extraction contracts, missing fields, output length/types, provider failure, offline attribution, input validation, statelessness and exact persistence of confirmed labelled context. Live configured AI was checked with a synthetic project-payment example. Browser checks covered direct Notes/Additional information edits, submitted confirmation payload, preservation after an intercepted save failure, cached edits, preserved source after an injected review failure, real-AI retry and mobile text expansion/layout. Web/iOS/Android resource exports passed in frontend/output/oracle-review-build. No synthetic cast was created in the development database for this check.
- Preview: frontend/output/playwright/oracle-structured-review-card-zh.png and oracle-structured-review-mobile.png.

## The Returning Light closing ritual — 2026-11-02

- Added a deliberate Seal This Reading entry after the completed interpretation. It does not auto-interrupt reading and stays disabled while the purchased interpretation is generating. A fullscreen, seven-second animation illuminates the actual six lines bottom-to-top, gathers three coin lights and settles into a pearl seal. Users can skip, close or replay it; system and manual reduced-motion settings bypass the continuous animation.
- The keepsake screen reunites the user with Selene, with a brief nod-like portrait movement, a farewell subtitle and optional speech. An explicitly selected voice setting now survives navigation between question and reading routes in the same running session. Closing/unmounting stops speech. Actual voice quality remains device-dependent.
- Added a 1080 × 1920 closing card using the true hexagram, topic, date and public editorial meaning. Questions, context and notes are excluded. A separate explicit checkbox can include the existing personal reflection prompt; preview and download share exactly the same SVG. Text is XML-escaped, decoded only after parsing for native/React previews, and wrapped without silently dropping long prompt lines.
- Optional Keep a thought uses the existing journal note and save endpoint, with no automatic memory opt-in. Temporary notes remain in the current page only; guests can sign in with the reading return path preserved. Users can return to their reading, go home or open their journal without downloading or saving a note.
- Validation: frontend typecheck and Web/iOS/Android resource exports passed. Browser checks used a synthetic reading and mocked account/save responses, with no development database writes: natural seven-second completion, explicit skip, replay/back navigation, four locales, system reduced motion, 390px layout, exact edited-note payload, temporary/guest restrictions, private-field exclusion, explicit personal-prompt inclusion and real 1080 × 1920 PNG download. Signed native builds and hardware voice checks are not covered by resource exports. No backend code changed and the backend suite was not rerun for this UI update.
- Screenshots and the exported sample are in frontend/output/playwright/closing-ritual-*.png and closing-oracle-card.png. Resource export is frontend/output/closing-ritual-build.

## Clear actions and closing order — 2026-11-02

- Moved The Returning Light below Ask the Oracle and above the journal, on desktop and mobile.
- New personal interpretations use four short numbered action parts: clarify one reported fact/unknown and define a vague goal operationally; try one small, reversible act with a time cue and budget; offer a usable suggested sentence; check observable completion and handle an unanswered point. This is a product adaptation of philosophical clarification, not a Wittgenstein quotation or a claim that he prescribed this framework. Follow-up prompts apply the same style when an action is requested.
- Introduced actionGuideVersion=crystal-1, optional AI attribution metadata and a validated 1200-character action field, keeping the existing string-based API compatible. Four-language editorial fallback samples use the same four-part format and are labelled as editorial rather than AI-generated.
- Existing readings expose Make this actionable. The access-controlled, rate-limited POST /oracle/casts/:id/action-guide refines and caches only the action and its attribution in the existing JSON. It does not create an order, recast coins, overwrite the interpretation or enable memory. Concurrent requests in one process coalesce; failures preserve the old action and remain retryable. Temporary expiry is checked again before saving. No new SQL migration is needed.
- The UI renders numbered headings and paragraphs, including both newline and colon-separated headings, and supports four interface locales. Legacy reading text keeps its original language; refinement uses the stored reading language where available.
- Validation: 89 backend tests passed; both typechecks, backend build, contract sync check and Web/iOS/Android resource exports passed. Tests cover action validation and four-language fallbacks, original-context prompting, cached/coalesced requests, attribution, failure/retry, access denial and preservation of the paid reading and immutable cast. A read-only provider probe produced a live Simplified Chinese payment-discussion guide using synthetic input. Browser checks used that real generated text with mocked reading/save responses, tested failure/retry, checked module order on desktop/mobile and verified the original interpretation was retained. No development reading was modified during QA. Screenshots: frontend/output/playwright/crystal-action-guide.png and crystal-action-guide-mobile.png. Resource export: frontend/output/crystal-action-build.

## Coin casting sound — 2026-11-03

- Added an original 1.18-second stereo copper-coin effect, with release, three landings and settling bounces. Asset provenance and its deterministic generation script are in frontend/assets/audio/README.md and frontend/scripts/make-coin-sound.py. No third-party audio is used.
- The cast page uses the SDK-compatible expo-audio player. Each casting click rewinds and plays one cue in the original user gesture; a finite one-second animation aligns its landings with the audio. Completing remaining lines together plays one cue. A synchronous request lock prevents duplicate submissions; pending animation/request work is cancelled on exit, without changing server coin randomness or recorded rounds.
- Added a four-language sound toggle, default on, stored only on the device. Muting stops the current effect immediately. Playback also stops on page exit or backgrounding. The app respects device silent mode, mixes with other audio and does not enable background audio. Existing speech-input microphone permission text and Android permission remain intact.
- Audio failures expose a quiet fallback message and leave casting usable. Verification used real browser audio with mocked cast APIs: no playback on entry, repeated start-from-zero playback and natural endings, muted casts, mute persistence after reload, immediate mute during playback, one batch cue, simulated autoplay rejection with successful casting and recovery on the next attempt. No development cast was created or changed during QA.
- Frontend typecheck and Web/iOS/Android resource exports passed in frontend/output/coin-sound-build. Native config introspection confirmed background audio is disabled and existing microphone configuration is retained. Native device listening remains a hardware check. Backend code did not change, so the backend suite was not rerun for this sound update.
