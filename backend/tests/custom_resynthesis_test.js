'use strict';

const path = require('node:path');
process.env.DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'storage', 'test-data.db');

const assert = require('node:assert');
const express = require('express');
const { getDatabase } = require('../db/database');
const smartChapterRepository = require('../repositories/smartChapterRepository');
const semanticChunkRepository = require('../repositories/semanticChunkRepository');
const bookRoutes = require('../routes/bookRoutes');
const synthesisService = require('../services/synthesis/synthesisService');
const provenanceResolver = require('../services/semantic/provenanceResolver');

async function run() {
  console.log('=== custom_resynthesis_test.js ===');
  console.log('--- Custom Re-synthesis Route & Architecture Contracts ---');

  const db = getDatabase();
  const testBookId = 'test-custom-resynth-book-' + Date.now();
  const now = new Date().toISOString();

  // Start express test server with bookRoutes
  const app = express();
  app.use(express.json());
  app.use('/api/books', bookRoutes);

  let server;
  let baseUrl;

  try {
    server = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    // Insert isolated test book
    db.prepare(`
      INSERT INTO books (id, title, author, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `).run(testBookId, 'Test Custom Resynthesis Book', 'Author', 'Test fixture', now, now);

    // Insert test source chunk
    const chunkId = `chk-test-${Date.now()}`;
    db.prepare(`
      INSERT INTO semantic_chunks (
        id, book_id, chapter_id, sequence, text_content, token_count, created_at, updated_at
      ) VALUES (?, ?, NULL, 0, ?, 180, ?, ?)
    `).run(
      chunkId,
      testBookId,
      'This is verbatim source material chunk 1 for custom resynthesis test with sufficient length and depth to exceed minimum source word threshold. Machine learning algorithms optimize loss functions through stochastic gradient descent across parameter manifolds.',
      now,
      now
    );

    // Helper to insert a smart chapter
    function insertSmartChapter(id, sequence, status, plannedChunkIds = [chunkId]) {
      db.prepare(`
        INSERT INTO smart_chapters (id, book_id, sequence, title, status, planned_source_section_ids, planned_word_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 300, ?, ?)
      `).run(id, testBookId, sequence, `Chapter ${sequence}`, status, JSON.stringify(plannedChunkIds), now, now);
    }

    // T1: POST /api/books/:bookId/chapters/:chapterId/resynthesize returns 404 for unknown book
    console.log('T1: Returns 404 for unknown book');
    const resT1 = await fetch(`${baseUrl}/api/books/unknown-book-999/chapters/ch-1/resynthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customInstruction: 'Make it concise' }),
    });
    assert.strictEqual(resT1.status, 404, 'Expected 404 for unknown book');
    console.log('  PASS: Unknown book returned 404');

    // T2: Returns 404 for unknown chapter in valid book
    console.log('T2: Returns 404 for unknown chapter');
    const resT2 = await fetch(`${baseUrl}/api/books/${testBookId}/chapters/nonexistent-ch-999/resynthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customInstruction: 'Make it concise' }),
    });
    assert.strictEqual(resT2.status, 404, 'Expected 404 for unknown chapter');
    console.log('  PASS: Unknown chapter returned 404');

    // T3: Returns 409 for generating chapter
    console.log('T3: Returns 409 for generating chapter');
    const genChapterId = `smart-gen-${Date.now()}`;
    insertSmartChapter(genChapterId, 1, 'generating');
    const resT3 = await fetch(`${baseUrl}/api/books/${testBookId}/chapters/${genChapterId}/resynthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customInstruction: 'Use bullet points' }),
    });
    assert.strictEqual(resT3.status, 409, 'Expected 409 for generating chapter');
    console.log('  PASS: Generating chapter returned 409');

    // T4: Custom re-synthesis passes customInstruction, forces claim on generated chapter, and invokes provenance
    console.log('T4: Custom re-synthesis processes successfully');
    const validChapterId = `smart-valid-${Date.now()}`;
    insertSmartChapter(validChapterId, 2, 'generated');

    let passedOptions = null;
    let verifiedRepId = null;
    const origResynthesize = synthesisService.resynthesizeChapter;
    const origVerify = provenanceResolver.verifyRepresentation;

    synthesisService.resynthesizeChapter = async (targetId, options) => {
      passedOptions = { targetId, ...options };
      smartChapterRepository.update(targetId, {
        status: 'generated',
        content: 'Custom re-synthesized content with user instructions preserved [Source 1].',
        metadata_json: {
          custom_instruction: options.customInstruction,
          resynthesis_source: options.resynthesis_source,
        },
      });
      return { success: true, targetId };
    };

    provenanceResolver.verifyRepresentation = async (repId) => {
      verifiedRepId = repId;
      return { success: true, repId };
    };

    try {
      const resT4 = await fetch(`${baseUrl}/api/books/${testBookId}/chapters/${validChapterId}/resynthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customInstruction: 'Highlight the math and formulas' }),
      });

      assert.strictEqual(resT4.status, 200, 'Expected 200 OK for custom re-synthesis');
      const bodyT4 = await resT4.json();
      assert.strictEqual(bodyT4.success, true, 'Response body success should be true');
      assert.ok(bodyT4.smartChapter, 'Response should contain smartChapter object');

      // Verify custom options passed to synthesisService
      assert.strictEqual(passedOptions.targetId, validChapterId, 'Target ID must match chapter');
      assert.strictEqual(passedOptions.force, true, 'force must be true to re-synthesize generated chapter');
      assert.strictEqual(passedOptions.customInstruction, 'Highlight the math and formulas', 'Custom instruction passed correctly');
      assert.strictEqual(passedOptions.resynthesis_source, 'custom', 'resynthesis_source must be custom');

      // Verify provenanceResolver was called
      assert.strictEqual(verifiedRepId, validChapterId, 'Provenance verification must be run for chapter');

      // Verify DB record was updated
      const updatedRecord = smartChapterRepository.getById(validChapterId);
      assert.strictEqual(updatedRecord.status, 'generated');
      console.log('  PASS: Custom re-synthesis succeeded with options and provenance verification');
    } finally {
      synthesisService.resynthesizeChapter = origResynthesize;
      provenanceResolver.verifyRepresentation = origVerify;
    }

    console.log('\n--- ALL CUSTOM RE-SYNTHESIS TESTS PASSED ---');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    try {
      db.prepare('DELETE FROM smart_chapters WHERE book_id = ?').run(testBookId);
      db.prepare('DELETE FROM semantic_chunks WHERE book_id = ?').run(testBookId);
      db.prepare('DELETE FROM books WHERE id = ?').run(testBookId);
    } catch (_) {}
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('FAILED: custom_resynthesis_test.js', err);
    process.exit(1);
  });
