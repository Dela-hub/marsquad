# Dilo Office (local)

A tiny local “office” UI to visualize agent activity.

## Run
```bash
node office/server.js
```

Then open:
- http://localhost:3010

## Send test events
In another terminal:
```bash
curl -X POST http://localhost:3010/api/event \
  -H 'content-type: application/json' \
  -d '{"type":"task.started","agent":"main","task":"demo","ts":'"$(date +%s000)"'}'

curl -X POST http://localhost:3010/api/event \
  -H 'content-type: application/json' \
  -d '{"type":"task.progress","agent":"main","task":"demo","progress":0.5,"ts":'"$(date +%s000)"'}'

curl -X POST http://localhost:3010/api/event \
  -H 'content-type: application/json' \
  -d '{"type":"task.done","agent":"main","task":"demo","ts":'"$(date +%s000)"'}'
```

## Event schema (v1)
POST `/api/event` JSON:
- `type`: `task.started|task.progress|task.done|task.error|agent.status|agent.move`
- `agent`: string (e.g. `main`, `sub:observatory-office-howto`)
- `task`: string optional
- `progress`: number 0..1 optional
- `status`: `idle|working|waiting|error` optional
- `pos`: `{x:number,y:number}` optional
- `text`: string optional
- `ts`: unix ms optional
