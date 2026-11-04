# Committed doors and celestial activity feedback

Each reading allows one committed door. Before choosing, either door can be opened or the user may write their own step. Once a door selection is saved, both door buttons are disabled: the chosen door stays open and the other remains closed. The reversal button and tap-to-close prompt disappear. Existing selected doors inherit this rule. Feedback and small actions remain editable.

The journey endpoint enforces the rule under its existing row lock. Switching or clearing a non-null selection returns `409 door_locked`; retrying the same selection is allowed. Exercises cannot target the opposite door. Competing requests commit only one choice. After a lost response or a conflicting choice from another device, the client reloads the authoritative reading before offering another action. No schema migration is required.

The paid reading's queued/generating card now shows an original vector starfield, a softly pulsing constellation/pearl and an orbiting star. The stage labels follow actual `premiumStatus`, with an indeterminate accessible progress indicator. No percentage or countdown is invented. Existing polling and manual refresh deliver the finished reading, at which point the animation is removed. Background generation behaviour is unchanged.

The returning homepage's Explore a new question button now has a lavender halo, breathing light, a travelling highlight and visible keyboard focus. Its label, target and full-width layout remain unchanged.

Both decorative effects stop while their route is unfocused, while the app is backgrounded, and when the system requests reduced motion. A static illuminated state remains available. New copy supports the four existing locales.

Validation: backend suite 128 tests, including simultaneous door choices, guest/account reloads, immutable selection, idempotent retry and exercise mismatch. Browser fixtures cover both chosen doors, lost-response recovery, reload, queued/generating/ready transitions, CTA navigation and motion, keyboard activation, mobile layout and reduced motion. Acceptance scripts/screenshots live under ignored `output/playwright/door-sky-*`. Browser fixtures do not modify development readings.
