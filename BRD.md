# Business Requirements Document (BRD)
## App: The Three Minds — Wellness Check-In App
**Version:** 1.0  
**Date:** April 30, 2026  
**Owner:** Darrian Belcher  
**Prepared For:** Personal wellness management, family & friends support network  

---

## 1. Executive Summary

Darrian Belcher is navigating a documented clinical profile that includes **Bipolar Disorder**, **ADHD** (Attention-Deficit/Hyperactivity Disorder), and a strong family genetic history of Bipolar disorder (paternal side) and ADHD/OCD (maternal side). He is currently prescribed **Mirtazapine** (mood + sleep support), **Atomoxetine** (ADHD), along with supplements including Vitamin D, Fish Oil, and Magnesium.

Darrian has developed a personal framework for his internal states — a three-part identity model inspired by anime characters that maps onto clinically-recognized models of mind regulation (Dialectical Behavior Therapy's "Three States of Mind"):

| Internal Name | Archetype | Clinical Equivalent | Description |
|---------------|-----------|---------------------|-------------|
| **Gohan** | Emotional Mind | Emotional Mind (DBT) | Feelings-driven, reactive, passionate, occasionally volatile |
| **Joyboy (Luffy)** | Middle Mind | Wise Mind (DBT) | Balanced, joyful, intuitive, centered |
| **Shikamaru** | Logical Mind | Reasonable Mind (DBT) | Analytical, strategic, calm, detached |

This app provides Darrian with a **daily self-check-in tool** and his trusted family/friends with a **real-time wellness dashboard** — enabling early intervention before episodes escalate, reducing isolation, and creating accountability without surveillance.

---

## 2. Problem Statement

People managing Bipolar Disorder + ADHD often experience:
- **Anosognosia** — lack of self-awareness during elevated or depressed episodes
- **Sleep disruption** as both a trigger and a symptom of mood episodes
- **Social withdrawal** during depression; over-engagement/impulsivity during mania/hypomania
- **Medication non-adherence** during destabilized periods
- **No easy way for trusted people to know something is wrong** without the person having to explain it

Current gaps:
- Existing mental health apps are generic and not personalized
- No tool exists that merges Darrian's specific personality framework with clinical wellness tracking
- Family and friends have no visibility unless Darrian explicitly reaches out

---

## 3. Solution Overview

**The Three Minds** is a mobile-friendly web application that allows:

1. **Darrian** to log a daily check-in (which "mind" is active, sleep hours, medication taken, mood score, notes)
2. **Family & friends** to view a clean, real-time wellness dashboard showing his current state with color-coded alerts
3. **Auto-alerts** if no check-in has been submitted in >24 hours or if distress is flagged

---

## 4. Research Basis

### 4.1 Bipolar Disorder — Evidence-Based Self-Management
- **Sleep tracking** is the #1 behavioral predictor of episode onset (Harvey et al., 2005; Frank et al., 2005 — Interpersonal and Social Rhythm Therapy)
- **Mood journaling** reduces episode severity and frequency (Scott et al., 2006)
- **Social rhythm stability** (consistent daily routines) dramatically reduces relapse (IPSRT evidence base)
- **Early warning signs** (EWS) identification reduces hospitalization by up to 30% (Morriss et al., 2007)

### 4.2 ADHD + Bipolar Comorbidity
- Co-occurring ADHD and Bipolar increases impulsivity, racing thoughts, and sleep disruption
- Atomoxetine (non-stimulant) is appropriate; stimulants can destabilize mood in bipolar patients
- Structured daily routines are protective for both conditions

### 4.3 DBT Three States of Mind (Linehan, 1993)
Darrian's Three Minds model directly maps onto DBT's framework:
- **Emotional Mind (Gohan)** — hot, reactive, feeling-driven
- **Reasonable Mind (Shikamaru)** — cool, logical, facts-focused  
- **Wise Mind (Joyboy/Luffy)** — integration of both; the goal state

DBT is evidence-based for both Bipolar Disorder and emotional dysregulation.

### 4.4 Safety Planning & Social Support
- **Stanley-Brown Safety Planning Intervention** (2012) — having a defined support network and warning sign list significantly reduces crisis severity
- **Peer/family involvement** in wellness monitoring (with consent) is a key component of NAMI-recommended care

---

## 5. Functional Requirements

### 5.1 Darrian's Dashboard (Primary User)
| # | Feature | Description |
|---|---------|-------------|
| F1 | Daily Check-In Form | Log: active mind, sleep hours, meds taken, mood (1-10), energy (1-10), notes |
| F2 | Three Minds Selector | Visual picker showing Gohan / Joyboy / Shikamaru with descriptions |
| F3 | Medication Tracker | Checkboxes for: Mirtazapine, Atomoxetine, Vitamin D, Fish Oil, Magnesium |
| F4 | Sleep Logger | Hours slept, sleep quality (1-5) |
| F5 | Distress Signal | One-tap "I need support" button that flags the family dashboard |
| F6 | History View | 7-day and 30-day log of check-ins with trend visualization |
| F7 | Early Warning Notices | App flags if sleep <5hrs for 2+ days, or mood <4 for 3+ days |

### 5.2 Family & Friends View (Secondary Users)
| # | Feature | Description |
|---|---------|-------------|
| F8 | Public Wellness Dashboard | Shows current active mind, last check-in time, color-coded status |
| F9 | Status Colors | Green (stable), Yellow (watch), Red (needs support) |
| F10 | No Check-In Alert | Visual alert if Darrian hasn't checked in within 24 hours |
| F11 | Distress Flag Display | Clear visual when Darrian has pressed the distress button |
| F12 | Trusted Contacts | Josh, Shenita listed as primary contacts to reach |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Privacy | Check-in details stay private to Darrian; family view only shows status + mind state |
| Accessibility | Mobile-first, large tap targets, readable fonts |
| Performance | Load in <2s on mobile data |
| Storage | LocalStorage for MVP; cloud sync in v2 |
| Design | Anime-inspired aesthetic reflecting the Three Minds characters |

---

## 7. Out of Scope (MVP v1.0)
- Push notifications
- Therapist/doctor portal
- AI-driven recommendations
- Multi-user accounts
- Backend server / cloud database

---

## 8. Success Metrics
- Darrian completes check-ins 5+ days/week
- Family members can identify Darrian's state without a phone call
- Distress signal used within 48 hours of an episode
- Sleep trends identifiable after 14 days of use

---

## 9. Trusted Contacts (from Darrian's network)
- **Josh** — Primary contact
- **Shenita** — Primary contact

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| Bipolar Disorder | A mood disorder characterized by episodes of mania/hypomania and depression |
| ADHD | Attention-Deficit/Hyperactivity Disorder — affects focus, impulse control, emotional regulation |
| Mirtazapine | Antidepressant used for mood and sleep |
| Atomoxetine | Non-stimulant ADHD medication |
| DBT | Dialectical Behavior Therapy — evidence-based therapy using Three States of Mind model |
| Anosognosia | Lack of awareness of one's own mental state/condition during an episode |
| IPSRT | Interpersonal and Social Rhythm Therapy — stabilizes mood via routine regulation |
| EWS | Early Warning Signs — personal indicators that an episode may be starting |

---

*This BRD was prepared based on Darrian's clinical profile, self-reported identity framework, and contemporary psychiatric research on Bipolar Disorder + ADHD management.*
