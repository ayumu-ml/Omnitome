const assert = require('assert');
const path = require('path');
const fs = require('fs');

process.env.DB_PATH = 'storage/test-mock-import-progression.db';

const { resetAndSeedDatabase } = require('../db/database');
const importQueueRepository = require('../repositories/importQueueRepository');
const importQueueService = require('../services/ingestion/importQueueService');

async function runMockImportVerification() {
  console.log('=== STARTING E2E MOCK IMPORT STEPPER PROGRESSION VERIFICATION ===');
  resetAndSeedDatabase();

  // 1. Setup mock SSE client listener
  const sseEvents = [];
  const sseLogs = [];
  const mockClient = {
    write(raw) {
      if (raw.startsWith(':')) return; // ignore comments / heartbeats
      const lines = raw.split('\n');
      let eventName = 'message';
      let data = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) eventName = line.slice(7).trim();
        else if (line.startsWith('data: ')) data = line.slice(6).trim();
      }
      if (eventName === 'telemetry') {
        try {
          sseEvents.push(JSON.parse(data));
        } catch (_) {}
      } else if (eventName === 'log') {
        try {
          sseLogs.push(JSON.parse(data));
        } catch (_) {}
      }
    }
  };

  importQueueService.addSSEClient(mockClient);

  // 2. Create a mock import task
  console.log('[Step 1] Creating mock import task...');
  const task = importQueueRepository.create({
    type: 'file',
    source_title: 'The Great Architectural Synthesis',
    source_meta: { originalFilename: 'synthesis_arch.pdf', fileSize: 1048576 },
    status: 'processing',
    stage: 'preparing',
    stage_label: 'Parsing document blocks and headings...',
    progress: 10
  });

  assert(task && task.id, 'Task must be created');
  assert.strictEqual(task.currentStage, 1, 'Initial stage must be 1 (Parsing)');
  assert.strictEqual(task.stageName, 'Parsing');
  console.log(`✓ Stage 1 verified: currentStage=${task.currentStage}, stageName="${task.stageName}", progress=${task.progressPercentage}%`);

  // 3. Progress to Stage 2: Indexing
  console.log('[Step 2] Transitioning to Indexing (BGE-M3 Embeddings)...');
  const taskStage2 = importQueueRepository.updateStage(task.id, 'semantic_index', 'running');
  assert.strictEqual(taskStage2.currentStage, 2, 'Stage must be 2 (Indexing)');
  assert.strictEqual(taskStage2.stageName, 'Indexing');
  console.log(`✓ Stage 2 verified: currentStage=${taskStage2.currentStage}, stageName="${taskStage2.stageName}", progress=${taskStage2.progressPercentage}%`);

  // 4. Progress to Stage 3: Classifying
  console.log('[Step 3] Transitioning to Classifying (Taxonomy & Reading Level)...');
  importQueueRepository.updateStage(task.id, 'semantic_index', 'done');
  const taskStage3 = importQueueRepository.updateStage(task.id, 'classify', 'running');
  assert.strictEqual(taskStage3.currentStage, 3, 'Stage must be 3 (Classifying)');
  assert.strictEqual(taskStage3.stageName, 'Classifying');
  console.log(`✓ Stage 3 verified: currentStage=${taskStage3.currentStage}, stageName="${taskStage3.stageName}", progress=${taskStage3.progressPercentage}%`);

  // 5. Simulate the Desync Edge Case: Classify finishes, Planning skipped, Synthesis starts
  console.log('[Step 4] Simulating Classify Complete -> Planning Skipped -> Auto-Synthesis Starting...');
  importQueueRepository.updateStage(task.id, 'classify', 'done');
  importQueueRepository.updateStage(task.id, 'outline', 'skipped');
  importQueueRepository.updateStage(task.id, 'synopsis', 'skipped');

  // Verify that even before synthesis is explicitly marked running, telemetry does NOT get stuck at Classifying
  const intermediateTask = importQueueRepository.getById(task.id);
  assert(intermediateTask.currentStage >= 4, `Must advance past Classifying (stage ${intermediateTask.currentStage})`);
  console.log(`✓ Desync avoided: intermediate currentStage=${intermediateTask.currentStage}, stageName="${intermediateTask.stageName}"`);

  // 6. Transition to Stage 5: Synthesizing
  console.log('[Step 5] Transitioning to Stage 5 (Synthesizing Loss-Bounded Omni Chapters)...');
  const taskStage5 = importQueueRepository.updateStage(task.id, 'synthesis', 'running');
  assert.strictEqual(taskStage5.currentStage, 5, 'Stage must be 5 (Synthesizing)');
  assert.strictEqual(taskStage5.stageName, 'Synthesizing');
  console.log(`✓ Stage 5 verified: currentStage=${taskStage5.currentStage}, stageName="${taskStage5.stageName}", progress=${taskStage5.progressPercentage}%`);

  // 7. Complete task
  console.log('[Step 6] Completing task to 100%...');
  importQueueRepository.updateStage(task.id, 'synthesis', 'done');
  const completedTask = importQueueRepository.update(task.id, {
    status: 'completed',
    stage: 'ready',
    stage_label: 'Ready to read',
    progress: 100,
    completed_at: new Date().toISOString()
  });
  assert.strictEqual(completedTask.currentStage, 5);
  assert.strictEqual(completedTask.stageName, 'Synthesizing');
  assert.strictEqual(completedTask.progressPercentage, 100);
  assert.strictEqual(completedTask.status, 'completed');
  console.log(`✓ Completion verified: currentStage=${completedTask.currentStage}, progress=${completedTask.progressPercentage}%, status="${completedTask.status}"`);

  // 8. Verify SSE broadcast telemetry events captured in stream
  console.log('[Step 7] Verifying SSE Telemetry event stream...');
  assert(sseEvents.length > 0, 'Must have received SSE telemetry events');
  const stageNumbers = sseEvents.map(e => e.currentStage);
  assert(stageNumbers.includes(1), 'Stream must have emitted Stage 1 telemetry');
  assert(stageNumbers.includes(2), 'Stream must have emitted Stage 2 telemetry');
  assert(stageNumbers.includes(3), 'Stream must have emitted Stage 3 telemetry');
  assert(stageNumbers.includes(5), 'Stream must have emitted Stage 5 telemetry');
  console.log(`✓ SSE Stream verified: Emitted stages [${stageNumbers.join(', ')}] without desync`);

  // 9. Verify real-time logs captured
  console.log('[Step 8] Verifying Real-time Ingestion Terminal Logs...');
  assert(sseLogs.length > 0, 'Must have captured logs');
  const logMessages = sseLogs.map(l => l.message);
  console.log(`✓ Captured ${sseLogs.length} live logs via SSE. Recent: "${logMessages[logMessages.length - 1]}"`);

  importQueueService.removeSSEClient(mockClient);

  // Clean up test database
  try {
    const dbPath = path.resolve(process.env.DB_PATH);
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
    if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
  } catch (_) {}

  console.log('=================================================================');
  console.log('🎉 E2E MOCK IMPORT PROGRESSION & TELEMETRY VERIFICATION PASSED!');
  console.log('=================================================================');
}

runMockImportVerification().catch((err) => {
  console.error('❌ Mock import verification failed:', err);
  process.exit(1);
});
