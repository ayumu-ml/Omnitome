# Canonical Test Book

> **Purpose.** A single real book every frontend and backend test
> verifies against. Not synthetic fixtures — real content with known
> ground truth. When a test passes against this book, it's not a
> coincidence.

## The book

**File:** `backend/tests/fixtures/practical_machine_learning.pdf`
**Title:** Practical Machine Learning: A Beginner's Guide with Ethical Insights
**Authors:** Nyamawe, Mjahidi, Nnko, Diwani, Minja, Malyango
**Publisher:** CRC Press, 2025 (Open Access)
**License:** CC-BY-NC-ND 4.0
**Book ID (current DB):** `book-1789899596664-rpfcd` (changes on reimport)

## Known ground truth — parse stage

| Stage | Expected | Verified |
|---|---|---|
| Total structures | 15 | ✅ |
| Front matter | 4 (title, about, preface, acknowledgments) | ✅ |
| Body chapters | 8 | ✅ |
| Appendices | 1 | ✅ |
| Index | 1 | ✅ |
| Total words | ~69,400 | ✅ |
| Parse time | ~2s | ✅ |

## Known ground truth — chunk + index stage

| Stage | Expected | Verified |
|---|---|---|
| Total chunks | ~490 | ✅ (494 observed 2026-09-20) |
| Chunk word range | 350–500 | pending |
| Embedding model | BGE-M3 1024d q8 | ✅ |
| Index time | ~10s | pending |

## Known ground truth — editorial + synthesis stage (v1.1.0 Verified)

| Stage | Expected | Verified Status (v1.1.0) |
|---|---|---|
| Outline chapters | 8 body chapters | ✅ 8 body chapters matching source |
| Synopsis drawn from | preface p.10 + TOC p.6 + first paras | ✅ Verified (abstract drawn from author's framing) |
| Smart chapter target | 250–360 words (dynamic 240–500 words) | ✅ Bounded ~7:1 compression ratio enforced |
| Smart chapter hard bounds | [150, 500] words | ✅ Clamped dynamically; prior-draft retry on violation |
| Provenance per chapter | Deterministic citation markers (`[1]`, `[2]`) | ✅ Deterministic chunk attribution via BGE-M3 + Reranker v2 |
| Fallback chapters (if provider up) | 0 | ✅ Zero fallbacks under normal provider execution |

## Frontend verification checklist

Walk this list against the canonical book after every frontend change.

| Check | Where | Pass criteria | Status (v1.1.0 Stable) |
|---|---|---|---|
| Library shows book + Omni badge | `/` (Library) | Card with badge & cover | ✅ PASS |
| Book Details opens | Click card | Hero + synopsis + chapters | ✅ PASS |
| Chapter list = 8 body chapters | Book Details | 8 visible, front matter excluded | ✅ PASS |
| Semantic status | Book Details | "Indexed: 494 chunks ● ready" | ✅ PASS |
| [Read] lands in Omni | Click Read | URL route `/read/:bookId/:chapterId` | ✅ PASS |
| Synopsis shows real content | Book Details | Non-fiction technical synopsis | ✅ PASS |
| Synopsis drawn from preface | Book Details | Content reflects author's framing | ✅ PASS |
| Omni chapter word range | Reader header | 250–360 words optimal (dynamic 240–500) | ✅ PASS |
| Inline citation markers | Reader body | Interactive clickable citations (`[1]`, `[2]`) | ✅ PASS |
| Omni chapters distinct | Reader body | Independent, non-duplicate compressed chapters | ✅ PASS |
| Original toggle / Citation jump | Reader panel | Exact highlighted verbatim source passage | ✅ PASS |
| Prev/Next navigation | Reader footer | Chapter N of 8 with keyboard shortcuts | ✅ PASS |

## Evolution & Resolved Milestones

### Phase 4.8.1 Resolution — Compressor Prompt + Word Bounds
- **Original Symptom (Sept 2026):** Early LLM prompts used "synthesize" terminology, causing the model to summarize at 1:1 or 2:1 ratios with 3,000-word outputs.
- **Resolution:** Re-anchored prompts strictly on **"compress"** instructions, establishing hard dynamic word ceilings [150, 500], prior-draft retry feedback, and the ~7:1 compression invariant.

### Phase 4.10 Resolution — Automatic Content-Type Detection
- **Original Symptom:** Import defaulted to `'novel'`, applying narrative fiction templates to technical textbooks.
- **Resolution:** Upgraded `ingestionService` and `documentStructureEngine` to dynamically classify technical textbooks, research papers, and prose, selecting appropriate synopsis extractors.

### Phase 4.11 Resolution — Grounding Density & Attributed Provenance
- **Original Symptom:** Thin source units could trigger hallucinated elaborations without direct citation grounding.
- **Resolution:** Enforced three-tier provenance enforcement (prompt citation demand, 80% citation validation threshold, and visual `text-ink-muted` defect indicators for ungrounded sentences).

### Naming Invariant
As codified in `docs/PRODUCT_VISION.md` and `AGENTS.md`, the platform is **Omnitome**, the derived representation is **Omni Reading**, and the ground truth is **Original Reading**. All pipeline steps represent **loss-bounded semantic compression**, never summarization.

---
## Reset + reimport procedure

```powershell
# Reset database
curl.exe -X POST http://localhost:3000/api/dev/reset

# Remove sample books (they interfere with frontend testing)
node -e 'const db=require("better-sqlite3")("storage/data.db");db.prepare("DELETE FROM books WHERE id LIKE ?").run("%sample%");console.log("samples cleared");'

# Import CRC PDF via API
curl.exe -X POST http://localhost:3000/api/books/import -F "file=@backend/tests/fixtures/practical_machine_learning.pdf"

# Capture new book ID
node -e 'const db=require("better-sqlite3")("storage/data.db");const b=db.prepare("SELECT id FROM books ORDER BY created_at DESC LIMIT 1").get();console.log(b.id);'

# Wait ~2–3 min for background pipeline, then verify counts
node -e 'const db=require("better-sqlite3")("storage/data.db");const b=db.prepare("SELECT id FROM books ORDER BY created_at DESC LIMIT 1").get();console.log("Chapters:",db.prepare("SELECT COUNT(*) c FROM chapters WHERE book_id=?").get(b.id).c);console.log("Chunks:",db.prepare("SELECT COUNT(*) c FROM semantic_chunks WHERE book_id=?").get(b.id).c);console.log("Reps:",db.prepare("SELECT COUNT(*) c FROM chapter_representations WHERE book_id=?").get(b.id).c);'