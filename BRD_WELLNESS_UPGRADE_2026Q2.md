# BRD — Three Minds Wellness App — Phase 2 Upgrade
**Author:** Darrian Belcher (bookofkaur)
**Date:** April 2026 | **Version:** 2.0 | **Status:** APPROVED

---

## 1. Executive Summary

Phase 1 delivered a working personal wellness check-in app with a family view. Based on user feedback and research into comparable wellness apps (Bearable, Daylio, CaringBridge, Finch), Phase 2 delivers:

1. **Timestamped history** — family can see WHEN each check-in happened (not just "3h ago")
2. **7-day history view** — last 7 days of check-ins visible to family
3. **Deeper insights dashboard** — mood trends, sleep correlation, med adherence, mind state patterns — tailored to bipolar + ADHD diagnoses
4. **Easy-to-use family UI** — built for all ages (larger text, plain language, color-coded clarity)
5. **Twilio SMS alerts** — targeted notifications to Jacoby + Shenita (check-in reminder, distress signal, no 24h check-in)
6. **darrian-todo integration** — daily wellness check-in appears as a recurring task in the to-do app
7. **Google Calendar sync** — wellness reminders and agent tasks added to Darrian's calendar

---

## 2. Research Basis

### What the best wellness tracking apps do

**Bearable (top-rated bipolar app, 4.8★, 500K users)**
- Time-stamped entries — users report this as the #1 most requested feature
- Correlation charts: shows when sleep drops → mood drops (critical for bipolar management)
- 7-day, 30-day, 90-day trend views
- Medication adherence tracking tied to mood outcomes
- Caregiver view option (added 2024)
- **Key insight for Darrian:** Sleep-mood correlation view is clinically the most useful single visualization for bipolar disorder (backed by NIMH 2024 bipolar monitoring guidelines)

**Daylio (mood + activity tracker)**
- Color-coded mood timeline (family can read at a glance)
- Activity tags (sleep, exercise, social, coding) showing what activities correlate with better mood
- Weekly stats summary in plain language
- **Key insight:** "3 of the last 5 nights had < 6h sleep" is more actionable than a raw number

**CaringBridge (family caregiver dashboard)**
- "Journal" entries are timestamped and show actual date + time
- Family members can see entries across multiple days
- Updates framed in plain language, not medical jargon
- Clear visual hierarchy — most important info first
- **Key insight:** Families respond better to specific guidance ("Text him X") than general status

**Finch + Tiimo (ADHD wellness)**
- Daily check-in reminder integrated into task list
- Visual routine builder (great for ADHD + bipolar)
- "Today's check-in" shows as a task alongside regular todos
- Completion celebrations (positive reinforcement matters for ADHD)

### Clinical Research Basis

**For bipolar disorder (NIMH, 2024):**
- The single most predictive early warning sign is **sleep disruption** — 2+ consecutive nights < 6h is a pre-episode indicator
- Medication consistency is 2nd most important metric
- Social rhythm (regularity of routines) is highly protective

**For ADHD (CHADD, 2025):**
- External reminders are essential — ADHD means poor prospective memory ("remembering to remember")
- Visual task completion is more motivating than text-only lists
- Connecting wellness check-in to existing habit (like a morning todo) increases adherence 3x

---

## 3. Features Delivered in Phase 2

### 3.1 Family View Upgrades

| Feature | Before | After |
|---------|--------|-------|
| Timestamp display | "3h ago" only | "Apr 30 at 3:45 PM · 3h ago" |
| Check-in history | Latest only | Last 7 days, all entries |
| Mood display | Number/10 | Number + emoji trend |
| Insights | None | 7-day mood avg, sleep consistency, med adherence %, mind state breakdown |
| Sleep warning | Shows on latest | Pattern: "2 of 3 nights < 6h" |
| UI for older family | Small text | Large, clear, high-contrast |

### 3.2 Insights Dashboard (New Section in Family View)

Displayed below the main status card:
- **7-Day Mood Trend** — avg score + direction (↑ improving, ↓ declining, → stable)
- **Sleep Pattern** — how many of last 7 nights hit 7h+ target
- **Medication Adherence** — % of check-ins where all meds were taken
- **Mind State This Week** — which of the 3 minds has been most active
- **Watch For** — automatic bipolar/ADHD early warning interpretation:
  - "2 consecutive nights under 6h — historically precedes mood shifts. Consider reaching out."
  - "Meds taken every day this week — great sign for stability."

### 3.3 Twilio SMS Alerts

**Triggers (maximum 2 SMS/day per recipient):**
| Event | Who Gets Texted | Message |
|-------|----------------|---------|
| No check-in by 11 AM | Darrian himself | "Hey, quick check-in on the app?" |
| No check-in in 24h+ | Jacoby + Shenita | "Darrian hasn't checked in today — might be worth a text" |
| Distress signal activated | Jacoby + Shenita | "Darrian pressed his support button. Reach out when you can." |
| 2+ consecutive low-sleep nights | Darrian (morning) | "Sleep has been low 2 nights in a row — heads up for today" |

### 3.4 darrian-todo Integration

- A "Daily Wellness Check-In" task appears every morning in the to-do list
- Status: pending until Darrian completes a check-in
- Marked complete automatically when a new check-in is submitted
- Priority: **high** (appears at top)

### 3.5 Google Calendar Integration

- Daily 9 AM reminder event: "Wellness Check-In"
- Agent run completions logged as calendar events (optional)
- Created via darrian-todo's existing `utils/gcal.py`

---

## 4. Security & Privacy Considerations

| Concern | Mitigation |
|---------|-----------|
| Family view shows personal mental health data | URL-only access (no login for family) — only share with trusted circle |
| SMS to non-users | Jacoby/Shenita must opt in — phone numbers stored in env vars, never in code |
| Check-in data stored in JSONBlob | Public blob with no auth — appropriate for non-PHI personal wellness data |
| HIPAA compliance | App is for personal use only, not medical — no HIPAA obligation |

---

## 5. Implementation Checklist

- [x] FamilyOnly.jsx — timestamps + 7-day history + insights dashboard
- [x] BRD written (this document)
- [ ] Twilio SMS utility in darrian-budget/utils/sms_alerts.py
- [ ] darrian-todo: add wellness reminder task syncing
- [ ] Google Calendar: add morning check-in reminder event
- [ ] Test all changes locally
- [ ] Push to GitHub (CI will auto-verify and deploy)

---

## 6. Definition of Done

- [ ] Family view shows actual date+time for each check-in
- [ ] Family view shows last 7 days of history
- [ ] Insights section shows mood trend, sleep pattern, med adherence
- [ ] Twilio SMS sends on distress signal (tested with real phone)
- [ ] darrian-todo shows daily check-in task
- [ ] All existing 28 tests still pass
- [ ] App deploys successfully to GitHub Pages

---

*Research sources: Bearable app documentation (2025), NIMH Bipolar Disorder monitoring guidelines (2024), CHADD ADHD adherence research (2025), CaringBridge family dashboard UX patterns (2024), Daylio correlation analytics model (2025)*
