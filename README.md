# SyncDoc

Collaborative Document Engine with **AST Conflict Resolution**.

Multi-user editors suffer from destructive overwrites when editing the same document at once. SyncDoc
stores documents as structural **AST node trees** in MongoDB, synchronizes real-time edits over a **Yjs CRDT**
WebSocket layer, and renders a **block-based React editor** that never clobbers in-flight local typing.
A DOMPurify-hardened transformation pipeline exports AST trees to HTML / Markdown / PDF while blocking XSS
fragments.

## How it works

```
                     ┌─────────────────────────── Backend (Node.js / Express / Mongoose) ───────────────────────────┐
                     │                                                                                              │
  Mongo (AST trees) │   models/ (nested Node schema,   sync/ (Yjs CRDT over ws)   transform/ (HTML/PDF/MD)         │
  + pre-save hooks  │   recursive pre-save hooks)      astAdapter (Y.Doc ↔ AST)   security/ (DOMPurify)            │
                     │          ▲                                   ▲                                                │
                     └──────────┼───────────────────────────────────┼──────────────────────────────────────────────┘
                                │  REST (GET/PUT doc, exports)       │  ws://localhost:4000/ws/<docId>
                     ┌──────────┼───────────────────────────────────┼──────────────────────────────────────────────┐
                     │   frontend: React block-based editor          │   y-websocket provider + awareness (cursors)│
                     │   one textarea per AST node, keyed by id      │   live "who is editing what" indicators      │
                     └──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Two engineers edit the same spec concurrently. User A types a paragraph while User B inserts a code block lower
down. Yjs merges both edits (CRDT convergence), and the block state indicators show who is editing each block so
layout-destructive overwrites never happen silently.

## Modules

| Module | Stack |
| --- | --- |
| AST Database | Express & Mongoose — nested node schemas, recursive pre-save hooks that trace block relationships |
| Synchronization Engine | Node.js & Yjs — WebSocket routing with CRDT conflict resolution + presence awareness |
| Custom Editor UI | React — block-based text interface that applies AST deltas without full text-area rebuilds |
| Transformation Pipeline | Node.js & DOMPurify — AST → PDF/HTML/Markdown with XSS hardening |

## Getting started

Prereqs: Node >= 18.13, npm >= 7, and a MongoDB connection string (local `mongod`, or a hosted URL such as
MongoDB Atlas). No Docker needed.

```bash
npm install

# point the backend at MongoDB (copy .env.example to .env and set MONGO_URI)
copy backend\.env.example backend\.env

# seed a demo document, then copy the printed id
npm run seed

# run backend + frontend in parallel
npm run dev
```

- Frontend: http://localhost:5173
- Backend:   http://localhost:4000 (API + WebSocket)

`backend/.env` (copy from `.env.example`, defaults shown):

```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/syncdoc
```

For a hosted database (e.g. MongoDB Atlas), set:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/syncdoc?retryWrites=true&w=majority
```

## REST API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Service health + Mongo state |
| GET | `/api/documents` | List documents (summary) |
| POST | `/api/documents` | Create a blank document `{title?, author?}` |
| GET | `/api/documents/:id` | Full document: nested `nodes` + flattened `blocks` |
| DELETE | `/api/documents/:id` | Delete a document |
| POST | `/api/import/markdown` | Import Markdown → AST document `{title?, author?, markdown}` |
| GET | `/api/documents/:id/export/html` | AST → sanitized HTML |
| GET | `/api/documents/:id/export/markdown` | AST → Markdown |
| GET | `/api/documents/:id/export/pdf` | AST → PDF (PDFKit) |

## Data model

An AST node (`backend/src/models/AstNode.js`):

```
{ nid, type, text, lang?, attrs?, parentId, order, children[] }
```

`type ∈ heading | paragraph | code | list | quote | image | divider`.

Nesting is recursive; the `Document` pre-save hook normalizes the tree (assigns `nid`, `parentId`, `order`) and
validates it (valid types, unique ids, no self-parent, missing-parent references, max depth 20). Validation logic
is pure (`backend/src/validators/ast.js`) and unit-testable without a database.

### Markdown → JSON mapping (sanity check)

```markdown
# Title
Intro paragraph.
`  `  `js
const a = 1
`  `  `
> quote
- one
- two
```

```json
[
  { "type": "heading",  "text": "Title", "attrs": { "level": 1 } },
  { "type": "paragraph","text": "Intro paragraph." },
  { "type": "code",     "text": "const a = 1", "lang": "js" },
  { "type": "quote",    "text": "quote" },
  { "type": "list",     "children": [
      { "type": "paragraph", "text": "one" },
      { "type": "paragraph", "text": "two" } ] }
]
```

## WebSocket protocol

Clients connect to `ws://<host>:4000/ws/<docId>`. The server speaks the standard Yjs sync protocol
(`y-protocols`): SyncStep1/SyncStep2 handshake, incremental updates, and awareness (cursors + presence).
Persistence writes the converged CRDT state back to Mongo as a nested AST tree (debounced 400 ms), re-validated
by the pre-save hook.

## Security

- All stored text is plain-text; every render path HTML-escapes and passes through `DOMPurify.sanitize` (server
  side, via jsdom).
- `sanitizeBlocks` strips tag-like fragments from non-code blocks on persistence and on Markdown import.
- Helmet security headers on all HTTP responses.

## Testing

```bash
npm run test            # backend (node:test) + frontend (vitest)
npm run test:backend    # AST validation, XSS/transform, CRDT convergence (10 clients)
npm run test:frontend   # delta merge, block store, app smoke
```

Backend tests need no MongoDB — validation and CRDT tests run fully in-memory. A full end-to-end integration
test (real WebSockets + in-memory Mongo via `mongodb-memory-server`) is opt-in:

```bash
INTEGRATION=1 npm run test:backend
```

## Week-wise plan mapping

| Week | Deliverable | Where |
| --- | --- | --- |
| 1 | AST modeling + recursive pre-save hooks; React document browser | `models/`, `validators/`, `DocumentBrowser` |
| 2 | Yjs WebSocket sync + presence; client sync + block indicators | `sync/`, `useDocumentSync`, `Block` |
| 3 | Transformation engine (PDF/HTML); block/cursor state tracking | `transform/`, `Block` cursor layer |
| 4 | DOMPurify hardening; polish live cursors + state indicators | `security/`, editor polish |
