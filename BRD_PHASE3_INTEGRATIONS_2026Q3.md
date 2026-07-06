# BRD — Three Minds Wellness App — Phase 3: Integrations & Adaptive Support
**Author:** Darrian Belcher (bookofkaur)
**Date:** July 2026 | **Version:** 3.0 | **Status:** DRAFT

---

## 1. Executive Summary

Phase 1 delivered the check-in app with family view. Phase 2 delivered timestamped history, the 7-day family view, the insights dashboard, and a full neurodivergent productivity module (Pomodoro, time blocking, MIT, voice-input todo). Phase 3 closes the loop between the pieces that exist but don't talk to each other yet, and finishes the Phase 2 items that never shipped:

1. **Finish Phase 2 carryover** — Twilio SMS alerts, darrian-todo daily check-in task sync, Google Calendar reminder (all designed in v2.0, none implemented)
2. **Mood-adaptive scheduling** — the standout deferred feature: Check-In data drives the Todo module's daily suggestions (low-energy day → MIT-only view; hypomanic day → enforced time-boxing with hard stops)
3. **Push notifications (PWA)** — installable app with gentle reminders, replacing "remember to open the site" with "the site remembers you"
4. **Privacy hardening** — move family-view data behind token-based access; audit what a public URL exposes
5. **School mode (OMSA)** — Georgia Tech OMSA starts August 2026; coursework enters the Todo module as first-class time-blocked work

The theme of Phase 3: **the app stops being three separate tools (check-in, family view, todo) and becomes one system that adapts to the day Darrian is actually having.**

---

## 2. Background & Carryover Audit

From the Phase 2 implementation checklist (BRD v2.0):

| Item | Status |
|------|--------|
| FamilyOnly.jsx — timestamps + 7-day history + insights | ✅ Shipped |
| Twilio SMS utility (`darrian-budget/utils/sms_alerts.py`) | ❌ Not built |
| darrian-todo: wellness reminder task syncing | ❌ Not built |
| Google Calendar: morning check-in reminder | ❌ Not built |

From the Productivity BRD "Out of Scope (Future Phases)" list, Phase 3 promotes:
- **Mood-state based schedule adaptation** (link to Check-In data) → **in scope, headline feature**
- **Push notifications for time block reminders** → **in scope via PWA**
- Calendar sync → in scope (carryover from Phase 2 anyway)
- Body doubling / Focusmate API, AI task decomposition, collaborative sharing → **still out of scope**

---

## 3. Requirements

### 3.1 Phase 2 Carryover — Alerts & Sync

**Twilio SMS** (per v2.0 spec, unchanged): max 2 SMS/day per recipient; triggers = no check-in by 11 AM (→ Darrian), no check-in 24h+ (→ Jacoby + Shenita), distress signal (→ Jacoby + Shenita), 2+ consecutive low-sleep nights (→ Darrian, morning). Phone numbers live in env vars only — never in this public repo.

**darrian-todo sync**: "Daily Wellness Check-In" task auto-created each morning (high priority, top of list), auto-completed when a check-in is submitted. Builds on the email→task sync pattern already working in darrian-budget (built July 2026).

**Google Calendar**: daily 9 AM "Wellness Check-In" event via darrian-todo's existing `utils/gcal.py`.

### 3.2 Mood-Adaptive Scheduling (headline)

The Check-In already captures mood, sleep, meds, and mind state. The Todo module already has MIT, Pomodoro, and time blocking. Phase 3 connects them:

| Today's check-in says | Todo module responds |
|-----------------------|----------------------|
| Low mood / low energy | Collapses to MIT-only view: "Pick 3. That's the whole day. 3 done = a win." |
| < 6h sleep (or 2+ low nights) | Suggests deferring non-urgent tasks; banner: "Low sleep — schedule light" |
| Hypomanic indicators (high energy + low sleep) | Time-**boxing** mode: every block gets a hard end time and an end-of-block alert; caps the day's scheduled hours |
| Stable / good day | Full schedule view, normal time blocking |
| No check-in yet today | Todo gently blocks planning: "Check in first — 30 seconds — then we'll plan the day" |

Rules are deterministic (no LLM), transparent, and overridable — the app suggests, never locks. Each adaptation shows *why* ("because sleep was 4h") so it builds self-knowledge rather than feeling bossy.

### 3.3 PWA + Push Notifications

- Add manifest + service worker; installable on phone home screen
- Notifications: morning check-in reminder, time-block start/end, Pomodoro complete
- Quiet hours (10 PM–8 AM) by default; all notifications individually toggleable
- Works offline for check-in capture; syncs when back online

### 3.4 Privacy Hardening

Current state: family view is URL-only access and check-in data sits in an unauthenticated blob. That was accepted for Phase 2; Phase 3 tightens it:

- Family view requires a token in the URL fragment (`#k=…`) — unguessable, revocable, never sent to the server in logs
- Rotate the blob ID and stop treating the old one as reachable
- Audit repo for anything person-identifying beyond what Darrian has chosen to publish; move names/numbers to env or config that is gitignored
- Document in README what data lives where and who can see it

### 3.5 School Mode (OMSA — starts August 2026)

- Course tasks get a `school` tag and their own color in time blocking
- Weekly view: assignment due dates as fixed anchors; study blocks auto-suggested around them
- Mood-adaptive rules apply to school work too (low day → "one lecture video" is the MIT, not "finish the assignment")

---

## 4. Out of Scope (Phase 4+)

- Body doubling / Focusmate integration
- AI-powered task decomposition
- Collaborative task sharing / accountability partner features
- Therapist/clinician export or reports

---

## 5. Implementation Checklist

- [ ] BRD reviewed and approved
- [ ] `sms_alerts.py` in darrian-budget + trigger evaluation job
- [ ] darrian-todo daily check-in task sync (create + auto-complete)
- [ ] Google Calendar 9 AM reminder event
- [ ] Adaptive rules engine (pure function: check-in → schedule mode) + tests
- [ ] Todo module renders per-mode views (MIT-only, time-box, normal, no-check-in)
- [ ] PWA manifest + service worker + notification permissions flow
- [ ] Family-view token access + blob rotation
- [ ] School tag + weekly anchor view (before Aug 2026 semester start)
- [ ] All existing tests pass; new features covered (target: keep coverage thresholds green)

---

## 6. Definition of Done

- [ ] A low-mood check-in visibly changes what the Todo module shows, with an explanation
- [ ] Distress signal sends a real SMS to Jacoby + Shenita (tested end-to-end)
- [ ] App installs to a phone home screen and fires a morning reminder
- [ ] Family view is unreachable without the token
- [ ] OMSA course tasks schedulable before the first week of class
- [ ] CI green; deployed to GitHub Pages

---

## 7. Success Metrics (30 days after ship)

| Metric | Baseline | Target |
|--------|----------|--------|
| Check-in streak (days/week) | ~unknown | ≥ 6/7 |
| Low-energy days that still complete ≥1 MIT | unknown | ≥ 70% |
| SMS false-positive rate (alerts family judged unnecessary) | — | < 1/month |
| Days planned via adaptive suggestion (vs manual) | 0 | ≥ 4/week |
| Missed assignment deadlines (post-Aug) | — | 0 |

---

*Phase 3 builds directly on BRD v2.0 (wellness upgrade) and the Q2 productivity BRD. Research basis carried forward: Bearable correlation model, NIMH bipolar monitoring guidelines (2024), CHADD ADHD initiation research (2025). New for this phase: mood-adaptive scheduling draws on Bearable's "energy budgeting" pattern and PWA notification best practice (quiet hours, per-channel opt-in).*
