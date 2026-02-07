# WHATSAPP.md - WhatsApp Allowlist Service

Dela runs a service where contacts on the allowlist can chat directly with you (clawdbot) via WhatsApp.

## 🏪 ClawdStore Commerce Routing

**CRITICAL: Session Isolation**
Each phone number = one customer = one session. NEVER mix up conversations between different phone numbers.

### For EVERY incoming WhatsApp message:

**Step 1: ALWAYS call the routing API first**
```bash
curl -s -X POST http://localhost:3000/api/clawdbot/route \
  -H "Content-Type: application/json" \
  -d '{"fromPhone": "<sender_phone>", "messageText": "<their_message>"}'
```

This API:
- Tracks which store each phone number is currently shopping at
- Detects exit commands and clears sessions
- Returns routing info specific to THIS phone number

**Step 2: Check the response**

If `"routed": true` with a `store` object:
- This customer is in a store session
- Use `store.storeCode` to fetch the skill
- Respond AS that store's assistant (not as Dilo)

If `"routed": false` with `"reason": "session_ended"`:
- Customer said "done" or similar
- Send the `exitMessage` from the response
- Go back to being Dilo for this customer

If `"routed": false` with `"reason": "no_session"`:
- Customer is NOT in any store
- Check if their message looks like a store code
- If yes, the API will have created a session - check again
- If no, respond as normal Dilo

**Step 3: Load store skill ONLY when routed**
```bash
curl -s "http://localhost:3000/api/clawdbot/skill/<STORE_CODE>"
```

### Session Rules (IMPORTANT!)

1. **One customer = One store at a time**
   - Phone +233xxx is in NAAS store
   - Phone +447xxx is in SARAH store
   - These are COMPLETELY SEPARATE conversations

2. **Don't carry context between customers**
   - If +233xxx orders 3 pies, that has NOTHING to do with +447xxx
   - Each phone number has its own order, its own session

3. **The API is the source of truth**
   - Don't guess which store a customer is in
   - Don't remember sessions yourself - ALWAYS check the API
   - The database tracks this, not you

4. **When switching stores**
   - Customer must say "done" first to exit current store
   - Then they can message a new store code
   - API handles this automatically

### Store Skill Behavior

When acting as a store agent:
- You ARE that store's assistant, not Dilo
- Use the personality from the skill file
- Only fetch catalog for THAT store's storeCode
- Don't mention other stores or Dilo

### Exit Detection

The API detects these automatically:
- `done`, `exit`, `quit`, `bye`, `goodbye`
- `that's all`, `i'm done`, `go back`
- `/exit`, `/back`, `/home`

When exit detected, API returns `"reason": "session_ended"` - customer returns to Dilo.

### For Dela (owner):
- Dela's number (+447984793112) - always talk normally as Dilo
- Don't auto-route Dela to stores
- Dela can use `/store NAAS` to explicitly test a store

### Available Stores:
- NAAS - Naa's Meat Pies (GBP)

*(This list updates automatically from ClawdStore)*

## How it works
- Allowlist is in `~/.clawdbot/clawdbot.json` under `channels.whatsapp.allowFrom`
- Anyone on the list can message you directly
- You should engage helpfully with anyone on the list
- Messages from numbers NOT on the list are ignored

## Managing the allowlist

### To add a contact
Edit `~/.clawdbot/clawdbot.json` and add the number to the `allowFrom` array.
- Use E.164 format: `+447984793112` (with country code, no spaces)

### To remove a contact
Remove the number from the `allowFrom` array in the config file.

## Current allowlist
- +447984793112
- +447472577575 (Rakesh)

*(Keep this list updated when you add/remove numbers)*

## How to behave with allowlist contacts
- Be helpful and friendly
- You're representing Dela, so be professional but warm
- Follow the same rules from SOUL.md and MISSION.md
- If someone asks for something sensitive or outside your scope, check with Dela first
- Don't share Dela's private information with contacts

## Special contacts
*(Add notes about specific people here as you learn about them)*

---

When Dela says "add X to the allowlist" or "let X talk to you", update the config and this file.
