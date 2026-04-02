

## Plan: Boost Meta signaling + Add Schedule event on calendar view

### Problem
- Traffic is unqualified (most select <€5K revenue)
- Meta has no signal differentiation between someone who sees the calendar vs someone who bounces at Q1
- No event fires when the calendar loads — the last trackable conversion point before GHL takes over

### Changes

**1. `src/components/quiz/result/GHLCalendarIframe.tsx`** — Fire `Schedule` Meta event on calendar load

When `handleLoad` fires (iframe loaded successfully), call `quizAnalytics.trackMetaPixelEvent('Schedule', ...)` with high value (€5,000). This becomes the optimization event for Meta — "this person SAW the calendar and is ready to book."

Also fire a Supabase analytics event `calendar_view` for internal tracking.

Props: add optional `quizScore` and `qualificationLevel` to pass context from parent.

**2. `src/components/quiz/result/QualifiedResult.tsx`** — Pass quiz context to calendar + fire `contact_form_viewed` on mount

- On component mount: fire `contact_form_viewed` event (currently defined but never called)
- On `contactSubmitted`: fire `InitiateCheckout` Meta event with €3,000 value (form submitted = checkout initiated, higher signal than AddToCart)
- Pass `quizScore` and `qualificationLevel` to `GHLCalendarIframe`

**3. `src/lib/analytics.ts`** — Add `viewContactForm()` call and ensure `Schedule` event type exists

- Add `viewContactForm` method that fires the existing `contact_form_viewed` Supabase event
- The `trackMetaPixelEvent` already accepts any event name, so `Schedule` works out of the box

**4. `src/components/quiz/QuizSection.tsx`** — Increase AddToCart values significantly

Current values are too low relative to the actual deal value. Increase to create stronger signal differentiation:
- Score ≥90: €30,000 → **€50,000** (premium_qualified, these are the ones Meta should find more of)
- Score ≥80: €15,000 → **€30,000**
- Score ≥70: €8,000 → **€15,000**

This tells Meta "a qualified lead is worth 50K, find me MORE of these people" vs the €50-€300 early funnel events.

### Value progression after changes

```text
PageView        €50     (everyone)
Scroll 50%      €100    (engaged)
CTA Click       €300    (high intent)
VSL 25%         €500    (watching)
Quiz Q1-Q3      €150-800 (answering)
AddToCart        €15K-50K (qualified, completes quiz)
InitiateCheckout €3,000  (submits contact form) [NEW]
Schedule         €5,000  (sees calendar)         [NEW]
Lead             €1K-2K  (GHL contact created)
```

The massive jump from early events (€50-800) to AddToCart (€15K-50K) gives Meta a crystal clear signal: "THESE sessions are the ones worth optimizing for."

### Files modified (4)
1. `src/components/quiz/result/GHLCalendarIframe.tsx` — Schedule event on load
2. `src/components/quiz/result/QualifiedResult.tsx` — contact_form_viewed + InitiateCheckout + pass context
3. `src/lib/analytics.ts` — viewContactForm method
4. `src/components/quiz/QuizSection.tsx` — bump AddToCart values

