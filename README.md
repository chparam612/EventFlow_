# EventFlow V2 — Smart Crowd Management for NMS

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Firebase%20Hosting-orange)](https://studio-5460981965-b6a76.web.app)

EventFlow V2 is a complete crowd management simulation and guiding tool built for **Narendra Modi Stadium (NMS)** — the 132,000 capacity cricket venue in Ahmedabad. Developed for **Google Prompt Wars 2026**.

## Problem Statement
Managing a massive 132k capacity crowd during high-stakes cricket matches leads to bottlenecks, safety hazards, and poor attendee experiences. 

## Our Vertical: Physical Event Experience
Creating a smooth, stress-free flow for hundreds of thousands of people moving through physical infrastructure.

## Core Insight (trust-first philosophy)
When attendees trust the venue's live instructions, they cooperate rather than rush. Transparent, multi-lingual, easily accessible directions defuse panic.

## Biomimicry Approach
- **Ant Routing**: Dynamically updating paths based on pheromonal (density) feedback.
- **Fish Schooling**: Moving crowds in cohesive blocks with local interactions.
- **Bee Waggle Dance**: Communicating the best gates and exit plans via clear, actionable paths.

## System Architecture
A three-panel sync loop:
1. **Attendee Panel**: Intake, customized arrival plan, step-by-step escort, and multi-lingual Gemini AI assistant.
2. **Staff Panel**: One-tap zone reporting ('MY ZONE IS CLEAR' / 'CROWDED') mapping directly to the live Firebase DB.
3. **Control Room**: Command center tracking live Google Maps overlays, simulation data, dispatching instructions, and generating AI-driven insights from crowd density vectors.

## Google Services Used
- **Firebase Realtime Database** — live 3-panel sync
- **Firebase Authentication** — role-based access
- **Firebase Hosting** — edge-cached PWA
- **Google Maps JS API** — real satellite NMS view with zone overlays
- **Google Gemini API** — AI chat + control room insights
- **Google Translate API** — 5 language support (simulated via static maps in this demo logic)

## How It Works
- **Pre-event**: Fans map arrival time and transit style on entry.
- **Arrival**: App shows live recommendations for gates A-I over real map bounds.
- **During**: Control room nudges fans for food or breaks based off AI insights.
- **Exit**: Live calculation outputs "Leave Now" vs "Wait 15 Mins".
- **Feedback**: Post-game analytics pushed back to staff.

## Demo Instructions (5-minute path for judge)
1. Go to root `/` -> Choose language, tap "Enter as Fan".
2. Fill the intake -> See recommended Gate B path.
3. Tap "AI Chat" (floating button) -> ask "Nearest restroom?" -> get a Gemini 2.0 response.
4. **Open a new tab** -> `/staff-login` -> Use `staff@eventflow.demo` / `Staff@123` -> Tap "MY ZONE IS CROWDED".
5. **Open a new tab** -> `/control-login` -> Use `control@eventflow.demo` / `Control@123` -> See map turn red! Send an instruction down to staff.

## Login Credentials
- **Attendee**: tap "Enter as Fan" (no login needed - anonymous auth)
- **Staff**: `staff@eventflow.demo` / `Staff@123`
- **Control**: `control@eventflow.demo` / `Control@123`

## Assumptions
- Staff members carry mobile devices and have cell service.
- Attendees can access the PWA via printed QR codes at the gates.

## Local Setup
```bash
npm install
node server.js
# Access at http://localhost:3000
```

## Running Tests
```bash
npm test
# Expected: "🎉 All 12 tests passed! EventFlow V2 verified."
```

## Future Roadmap
- Deeper integration with turnstile APIs.
- Real-time video density analysis with Gemini 1.5 Vision.

## Accessibility
EventFlow is built with large tap targets, high contrast dark-mode defaults, and screen-reader compliant semantic routing to meet AA standard needs.