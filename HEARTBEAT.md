# HEARTBEAT.md — Mission Control (small + testable)

# If this file is empty, heartbeats will be skipped.
# Keep this short to reduce token burn.

## CRITICAL: Brief Recipient
**Morning Briefs and Nightly Builds go ONLY to: +447984793112**
Never send to +447575919313 or any other number.

## Every heartbeat (do silently)
- Read: SOUL.md, USER.md, memory/YYYY-MM-DD.md (today) and (if exists) yesterday.
- Load/update state file: memory/heartbeat-state.json
  - Keep keys: lastHeartbeatEpoch, morningBriefDate, nightlyBuildDate
  - Dates are Europe/London local date: YYYY-MM-DD

## Decide what to do
Use Europe/London local time.

### Morning Brief (once per day)
Run if:
- time is between 06:00–10:30, AND
- state.morningBriefDate != today

Then:
- Produce the Morning Brief using prompts/morning-brief.md
- Set state.morningBriefDate=today

### Nightly Build
Disabled.

### Otherwise
- Reply exactly: HEARTBEAT_OK

## Always
- Update state.lastHeartbeatEpoch=now (unix seconds)
- If late night (23:00–08:00) and nothing urgent: prefer HEARTBEAT_OK.
- In group chats: only speak if directly asked/mentioned.
