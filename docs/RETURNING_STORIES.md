**Returning stories — batch A, 2026-11-03**

**Compact homepage revision**

The homepage presents the next-chapter card and a compact constellation side by side at widths of 900px and above, stacking them on smaller screens. The next-chapter card uses a small title and disclosure; preference, switching and hiding controls are under the accessible Story options button. Its private content and update controls open on request. The compact constellation shows stars and counts; a star opens its details, and the full journal retains the larger constellation with text controls. Touch targets remain at least 44px.

With eight synthetic stories, the collapsed cards measured 144px and 159px on a 1440px desktop viewport, and 169px and 159px on a 390px phone viewport. Checks cover management, updating, star details, the journal, Chinese labels and 320px overflow. Screenshots: `output/playwright/compact-home-desktop.png`, `compact-home-mobile.png` and `compact-home-zh-mobile.png`.

The homepage now gives signed-in returning users a private, folded story card before the constellation and new-question entry. Users can reveal their own question/action, submit a status with optional detail, switch stories, hide a card for the current visit, and choose a current story across visits/devices. With no selected active story, invitations use the least recently updated followed story. Paused, private, guest, expired and incomplete stories cannot become active invitations. A saved reading without an action remains available as a quiet fallback. New visitors retain the existing question journey.

The reading and homepage share `OracleStoryUpdate`. Explicit status choices are tried, considering, changed, and paused. Saving is a separate confirmation and requires no writing. Changed situations use `kind: changed` with `status: waiting`, preserving a distinction from waiting without claiming success or resolution. Historical entries without a kind remain compatible. Pausing disables follow-up invitations; resuming requires the existing explicit follow/save action. The original coins, hexagram, paid interpretation and AI memory preferences are unaffected.

Successful updates create visible constellation nodes and a finite, reduced-motion-aware acknowledgement. Stars have touch/keyboard targets and paired text controls. A selected star reveals an optional private timeline. Seven stories fit the preview; a just-updated older story is brought into that preview. The history button opens the existing journal, whose API still returns its latest 100 readings. Pagination beyond that existing limit is outside this batch.

**API and migration**

- Apply additive backend migration `013_returning_stories.sql` after `012_story_experience.sql`. It creates account-owned `oracle_return_preferences`, with a nullable selected cast foreign key. Deleting a cast clears its selection; deleting an account removes its preferences. Account export includes the preference.
- `GET /oracle/journal` additionally returns `returnPreferences: { currentCastId }`.
- `PATCH /oracle/return-preferences`, `{ currentCastId: UUID | null }`, accepts only the authenticated user's active, permanent, completed story with an action and explicit following enabled. Null restores automatic order. The selected story must also occur in the loaded journal window to be shown.
- `PATCH /oracle/casts/:id/journey` accepts update text omitted or empty, requires an explicit status and existing action, and accepts optional `kind: status | changed`. Limits remain 20 updates, 600 detail characters, 400 action characters. A row lock and stable UUID make exact retries idempotent; conflicting reuse returns 409. Replaying an older update does not regress a newer status.
- A newly committed update emits one `oracle_story_updated` analytics event containing status and kind only. It excludes questions, journal text and other free input. Opening the page alone is not an update event.

Network failure preserves input and retries with the same update ID. A server-side full-story response stops submission and offers the journal while retaining any unsaved detail. Unavailable stories stop accepting updates. Anonymous/temporary updates retain the original expiry and receive explicitly temporary feedback rather than a permanent-constellation promise. New UI strings support US English, UK English, Simplified and Traditional Chinese; stored personal text retains its original language.

**Validation**

Backend: 107 tests passed across 10 files, including text-free updates, concurrent retries, analytics without private content, changed/status validation, old retry ordering, pause/resume, the 20-entry boundary, preference ownership, temporary/expired exclusion, export and account/reading deletion. Frontend selection tests cover current-story priority, least-recent-chapter ordering, hidden/paused/private/expired records and stale response protection. Frontend/backend TypeScript, contract synchronization and backend compilation passed.

Web, iOS and Android resource exports pass under `output/return-stories-build`. Native exports verify bundling, not signed builds or physical device behaviour.

Browser QA uses isolated synthetic API fixtures, without writing development user records. It covers desktop and 390px layouts, privacy before reveal and after reload, a text-free update, an older star entering the preview, a lost response followed by an identical retry, current-story persistence and save failure, pause exclusion, switching/hiding stories, star controls, journal access, four languages, reduced motion, reading-page updates, full/expired recovery, saved-reading fallback and guest/empty states. Additional checks cover 320px layout, keyboard controls, retained drafts and temporary feedback.

Screenshots and the reproducible browser fixture/scripts are in ignored `output/playwright/return-*` files. These checks establish implementation behaviour; changes in retention require a real cohort experiment. This batch adds no daily interaction, decorative reward system, notification schedule or subscription.
