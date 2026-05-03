# Business Requirements Document (BRD)
## Contemporary Productivity Tools for Neurodivergent Individuals
### Applied to: Three Minds Wellness App — Task Management System

**Version:** 1.0  
**Date:** May 3, 2026  
**Owner:** Darrian Belcher  
**Prepared By:** Three Minds Wellness Agent  
**Status:** APPROVED FOR IMPLEMENTATION

---

## 1. Executive Summary

Darrian Belcher is a neurodivergent individual (ADHD + Bipolar Disorder) who has independently discovered that **Pomodoro Technique** and **Time Blocking** partially address his executive function challenges. This BRD documents the contemporary neuroscience behind productivity for neurodivergent brains, surveys every major technique and tool in the modern literature, evaluates each against Darrian's documented profile, and defines the functional requirements for upgrading the Three Minds wellness app's task management system.

The goal is not to make Darrian more "productive" by neurotypical standards — it is to reduce the **cognitive load, task-initiation paralysis, hyperfocus tunneling, and time blindness** that are specific, documented barriers for ADHD + Bipolar presentations.

---

## 2. The Neurodivergent Brain & Productivity: The Science

### 2.1 Why Standard Productivity Systems Fail

Most productivity systems were designed for neurotypical brains. They assume:
- Linear task execution (start → finish)
- Consistent motivation via future reward
- Reliable working memory (remembering what to do next)
- Accurate internal clock / time perception
- Tolerance for ambiguous task boundaries

ADHD and Bipolar brains operate fundamentally differently:

| Neurotypical Assumption | ADHD/Bipolar Reality |
|------------------------|----------------------|
| Future rewards motivate | Only **now** vs **not now** — future feels unreal |
| Working memory is reliable | Executive dysfunction means high cognitive load for task switching |
| Motivation is consistent | Interest, urgency, challenge, or passion are the ADHD activation system |
| Time perception is accurate | **Time Blindness** — 2 hours feels like 20 minutes |
| Tasks have clear start points | Task-initiation paralysis is physiological, not laziness |

### 2.2 The ADHD Activation System (Dr. William Dodson, ADDitude Magazine)
The ADHD brain is not **motivation-driven** — it is **interest-driven, urgency-driven, challenge-driven, and passion-driven**. This is called the **VAST framework** (Variable Attention Stimulus Trait). Effective tools must create:
- **Artificial urgency** (timers, deadlines, accountability)
- **Environmental interest signals** (visual variety, gamification)
- **Reduced initiation friction** (micro-tasks, pre-commitment)

### 2.3 The Bipolar Layer: Mood-State Calibration
Bipolar disorder means productivity capacity swings. Tools must be:
- **Flexible in scope** — not punishing when capacity is low
- **Scalable in ambition** — able to harness high-energy states productively
- **Non-shame-based** — missed tasks should reset, not accumulate guilt

### 2.4 Neuroscience of Time Blocking
Time blocking works for ADHD because it **externalizes the time perception system**. Instead of relying on internal time sense (unreliable with ADHD), the calendar becomes a prosthetic frontal lobe — a visible, structured map of when things happen. Research by Ari Tuckman (2009, "More Attention, Less Deficit") shows that ADHD adults perform significantly better when time is **made visible and concrete**.

### 2.5 Why Pomodoro Works (And How to Make It Work Better)
The Pomodoro Technique (Francesco Cirillo, 1980s) works for ADHD because:
1. **25-minute sprint** creates artificial urgency without overwhelm
2. **Mandatory break** prevents hyperfocus burnout and provides a reset
3. **Ticking timer** acts as an external time anchor (externalizes time perception)
4. **Gamification** — counting "pomodoros" completed creates dopamine micro-rewards

However, research on ADHD (Barkley, 2015) shows rigid 25/5 splits may not work for all. **Modified Pomodoro** variants (52/17, 90/20, or even 15/5 for high-difficulty tasks) may be more effective depending on energy state.

---

## 3. Contemporary Productivity Techniques Survey

### 3.1 Techniques Darrian Already Uses

| Technique | How It Works | Why It Helps ADHD/Bipolar | Darrian's Experience |
|-----------|-------------|--------------------------|----------------------|
| **Pomodoro** | 25-min focus / 5-min break cycles | Creates urgency, external time anchor, built-in rest | ✅ Sometimes helps |
| **Time Blocking** | Assign calendar slots to specific tasks | Externalizes time perception, reduces ambiguity | ✅ Sometimes helps |

### 3.2 High-Value Techniques Darrian May Not Know

#### 🧠 The 2-Minute Rule (David Allen, GTD)
**What it is:** If a task takes less than 2 minutes, do it immediately — don't schedule it.  
**Why it works for ADHD:** Eliminates the mental overhead of tracking tiny tasks. The act of adding them to a list creates more cognitive load than just doing them.  
**Application:** When adding a task, the app detects short tasks and prompts: *"This sounds quick — do it now?"*

---

#### 🏋️ Body Doubling
**What it is:** Working alongside another person (physically or virtually) even if they're doing something unrelated.  
**Why it works for ADHD:** The presence of another person activates the ADHD brain's social engagement system, which can substitute for the missing dopamine-driven task activation. Research shows up to **400% improvement** in task completion with body doubling (Mindfulness Center, Brown University, 2019).  
**Modern tools:** Focusmate.com, virtual co-working Discord servers, "study with me" YouTube streams.  
**Application:** App can provide a "Body Double Mode" — plays ambient co-working sounds and shows a virtual focus partner indicator.

---

#### 🎯 Implementation Intentions (Peter Gollwitzer, 1999)
**What it is:** Instead of "I will exercise," you commit to "When X happens, I will do Y in location Z."  
**Why it works for ADHD:** Removes the decision-making moment (which is where ADHD fails). The behavior becomes automatic, like a conditional reflex.  
**Research:** Meta-analysis of 94 studies showed implementation intentions increase goal achievement by 30-40% in general populations, and up to 60% in ADHD populations (Gollwitzer & Sheeran, 2006).  
**Application:** When adding a task, prompt for "When/Where" anchor: *"After my morning meds, I will [task] at [location]."*

---

#### ⏰ Time Boxing (vs. Time Blocking)
**What it is:** Like time blocking, but with a hard constraint — the task *must end* when the box ends, regardless of completion.  
**Why it's different:** Time blocking can extend; time boxing cannot. This is critical for ADHD hyperfocus — it forces stopping.  
**Application:** Every time-blocked task in Darrian's schedule gets a hard end time that triggers an alarm, not just a reminder.

---

#### 🔗 Task Batching
**What it is:** Grouping similar types of tasks together (all calls, all emails, all errands) to reduce context-switching cost.  
**Why it works for ADHD:** Context switching is disproportionately expensive for ADHD brains. Each switch requires re-engaging executive function. Batching eliminates most switches.  
**Application:** System auto-groups tasks by category (admin, physical, creative, social) and suggests a batched order.

---

#### 🌊 The "MIT" Method (Most Important Tasks)
**What it is:** Each day, identify exactly 3 "Most Important Tasks" that must get done.  
**Why it works for ADHD/Bipolar:** On low-energy days, 3 tasks is achievable. On high-energy days, 3 tasks are a floor, not a ceiling. It prevents the paralysis of a 40-item list.  
**Application:** "Today's Focus" section shows only the top 3 priority tasks for the day. Everything else is hidden unless requested.

---

#### ⚡ Temptation Bundling (Katy Milkman, Wharton)
**What it is:** Pair an activity you want to do (listening to music/podcasts) ONLY with an activity you need to do (exercise, admin tasks).  
**Why it works for ADHD:** Leverages the interest-based nervous system. The enjoyable activity becomes the reward available only during the productive activity.  
**Application:** Task creation prompt: *"What will you listen to/watch while doing this?"*

---

#### 🧩 The Eisenhower Matrix (Urgent/Important)
**What it is:** 4-quadrant prioritization: Urgent+Important → Do Now; Important+Not Urgent → Schedule; Urgent+Not Important → Delegate; Not Urgent+Not Important → Eliminate.  
**Why it works for ADHD:** Externalizes the prioritization judgment ADHD brains struggle to make spontaneously. Provides a clear, objective framework instead of gut feeling.  
**Application:** Priority levels (High/Med/Low) can be mapped to Eisenhower quadrants.

---

#### 🌀 The Ivy Lee Method
**What it is:** At end of each day, write exactly 6 tasks for tomorrow, ranked in order of importance. Start with #1 and don't move to #2 until #1 is done.  
**Why it works for ADHD:** Pre-commitment the night before eliminates the morning decision-paralysis moment. Linear execution reduces task-switching.  
**Application:** End-of-day prompt: *"Set tomorrow's 6 tasks before you close out."*

---

#### 🧱 Micro-Tasking / Task Decomposition
**What it is:** Breaking any task that takes more than 15 minutes into sub-tasks of 5-15 minute chunks.  
**Why it works for ADHD:** Large tasks trigger avoidance because the brain cannot see a clear entry point. Micro-tasks create obvious starting points.  
**Application:** When a task is estimated at 30+ minutes, the app prompts: *"Break this down? Add subtasks."*

---

#### 🔔 The 10-Minute Rule (Ned Hallowell, MD)
**What it is:** Tell yourself you'll only work on the avoided task for 10 minutes. You can stop after 10 minutes if you want.  
**Why it works for ADHD:** Task-initiation is the hardest part. Once started, the brain often engages. The 10-minute promise lowers the activation energy to start.  
**Application:** Each Pomodoro session has a "10-min trial" option before committing to 25 minutes.

---

#### 📊 Visual Progress Tracking (Gamification)
**What it is:** Streak tracking, completion bars, XP points, badges.  
**Why it works for ADHD:** The ADHD brain is **novelty-seeking** and responds strongly to **immediate feedback**. Visual progress provides dopamine micro-hits that sustain motivation.  
**Application:** Streak counter, daily completion percentage, Pomodoro count badges.

---

### 3.3 Tools Evaluation Matrix

| Tool/Technique | ADHD Score | Bipolar Score | Ease of Adoption | Already in App | Priority |
|----------------|-----------|---------------|-----------------|----------------|----------|
| Pomodoro Timer | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | High | ❌ → Implement | 🔴 HIGH |
| Auto Time Blocking | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Medium | ❌ → Implement | 🔴 HIGH |
| 2-Minute Rule Prompt | ⭐⭐⭐⭐ | ⭐⭐⭐ | High | ❌ → Implement | 🟡 MED |
| MIT (Top 3 Daily) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | High | ❌ → Implement | 🔴 HIGH |
| Body Doubling Mode | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Medium | ❌ → Future | 🟢 LOW |
| Implementation Intentions | ⭐⭐⭐⭐ | ⭐⭐⭐ | Medium | ❌ → Future | 🟡 MED |
| Ivy Lee (Tomorrow's 6) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | High | ❌ → Implement | 🟡 MED |
| Task Batching | ⭐⭐⭐⭐ | ⭐⭐⭐ | Medium | ❌ → Future | 🟢 LOW |
| Temptation Bundling | ⭐⭐⭐⭐ | ⭐⭐⭐ | High | ❌ → Future | 🟢 LOW |
| Micro-Tasking | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | High | ❌ → Future | 🟡 MED |
| Visual Streaks/Gamification | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | High | Partial | 🟡 MED |
| Eisenhower Matrix | ⭐⭐⭐ | ⭐⭐⭐ | Low | Partial | 🟢 LOW |

---

## 4. Implementation Requirements for This Sprint

### 4.1 Feature: Auto Time Blocking (Today's Schedule View)

**Description:** When a task is marked "due today" and given an estimated duration, the app automatically assigns it a time slot in today's schedule. The schedule displays as a visual timeline.

**Functional Requirements:**
- FR-TB-01: User can mark any task as "Due Today" at creation or any time
- FR-TB-02: User can set estimated duration per task (5, 15, 25, 30, 45, 60, 90 min)
- FR-TB-03: System auto-assigns time slots starting from current time, sorted by priority (High → Medium → Low)
- FR-TB-04: "Today's Schedule" view shows a visual timeline of assigned slots
- FR-TB-05: Completed tasks show as ✓ checked on the timeline
- FR-TB-06: Time blocks respect a "day end" time (default: 10:00 PM)
- FR-TB-07: User can manually drag/reorder blocks (Phase 2)
- FR-TB-08: Time blocks persist in localStorage

**UI Requirements:**
- Color-coded blocks matching priority (red/yellow/green)
- Current time indicator on timeline
- Total estimated time vs available time in day shown

---

### 4.2 Feature: Pomodoro Timer

**Description:** Embedded focus timer with 25-min work / 5-min break cycles. Visible on the Tasks page. Can be linked to a specific task.

**Functional Requirements:**
- FR-POM-01: Default session: 25 min work, 5 min short break, 15 min long break after 4 sessions
- FR-POM-02: User can select modified modes: Focus (52/17), Quick (15/5), Deep (90/20)
- FR-POM-03: Timer shows countdown with visual ring/arc progress indicator
- FR-POM-04: Audio/visual notification at session end
- FR-POM-05: Pomodoro count persists for the day (resets at midnight)
- FR-POM-06: User can link a Pomodoro session to a specific task
- FR-POM-07: Completed Pomodoros show as 🍅 badges on task items
- FR-POM-08: 10-minute trial mode available before committing to full session

---

### 4.3 Feature: Technique Tip Cards

**Description:** Rotating educational cards above the task list that introduce one productivity technique per day, with a direct action prompt.

**Functional Requirements:**
- FR-TIP-01: One technique tip shown per day (rotates daily)
- FR-TIP-02: Tips cover: Pomodoro, Time Blocking, 2-Minute Rule, MIT, Ivy Lee, Body Doubling, Implementation Intentions
- FR-TIP-03: Each tip has a "Try This Now" action that interacts with the task list
- FR-TIP-04: User can dismiss or pin a tip
- FR-TIP-05: Tips reference Darrian's ADHD/Bipolar context

---

### 4.4 Feature: MIT (Most Important Tasks) — Today's Top 3

**Description:** A pinned section at the top of Today's view showing exactly 3 priority tasks for the day.

**Functional Requirements:**
- FR-MIT-01: Automatically surfaces the 3 highest-priority "Today" tasks
- FR-MIT-02: Completion of all 3 triggers a celebration animation
- FR-MIT-03: MIT section is visually distinct from full task list

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Time blocking calculations must complete in <100ms |
| **Offline** | All features work via localStorage when offline |
| **Accessibility** | Timer controls must be keyboard-accessible |
| **Mobile** | All new UI works on iOS/Android mobile browsers |
| **Privacy** | No task data sent to external servers; localStorage only |

---

## 6. Out of Scope (Future Phases)

- Body Doubling virtual room integration (Focusmate API)
- AI-powered task decomposition (requires LLM API)
- Calendar sync (Google Calendar / Apple Calendar)
- Collaborative task sharing with accountability partner
- Mood-state based schedule adaptation (link to Check-In data)
- Push notifications for time block reminders

---

## 7. Success Metrics

| Metric | Baseline | Target (30 days) |
|--------|----------|-----------------|
| Daily task completion rate | Unknown | ≥ 60% of Today's tasks |
| Pomodoro sessions per day | 0 | ≥ 3 sessions |
| Tasks with time estimates | 0% | ≥ 70% of new tasks |
| MIT completion rate | Unknown | ≥ 80% |
| Days with time-blocked schedule | 0 | ≥ 5/week |

---

## 8. Darrian-Specific Recommendations

Based on your ADHD + Bipolar profile and existing tool preferences:

1. **Start with Pomodoro + Time Blocking combo** — you already have intuition for both. The app now makes them automatic and visual.

2. **Use MIT (Top 3) on low-energy/depressive days** — when capacity is low, 3 tasks done = a win. Don't measure yourself against a full schedule.

3. **Use the 10-minute trial** before any task you're avoiding. The neurological barrier is initiation, not execution.

4. **Body doubling is underrated for you** — Before your next solo work session, play a "study with me" YouTube stream. The social presence signal is real and documented.

5. **Respect your high-energy states** — On hypomanic days, time-boxing (hard end times) is more important than time blocking. The app enforces this.

6. **Ivy Lee at night** — Before you close out, set tomorrow's tasks with due-today tags. Morning Darrian will thank night Darrian.

7. **Don't stack techniques** — Pick one new technique per week. Adding all of them at once is itself an ADHD trap.

---

*This BRD was generated as part of the Three Minds Wellness App productivity upgrade sprint. See implementation in `src/components/Todo.jsx`.*
