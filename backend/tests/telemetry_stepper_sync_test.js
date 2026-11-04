process.env.DB_PATH = process.env.DB_PATH || 'storage/test-telemetry-data.db';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { getDatabase, resetAndSeedDatabase } = require('../db/database');
const importQueueRepository = require('../repositories/importQueueRepository');
const importQueueService = require('../services/ingestion/importQueueService');

async function runTelemetrySyncTests() {
  console.log('=== RUNNING STRUCTURED TELEMETRY & STEPPER SYNC VERIFICATION ===');
  resetAndSeedDatabase();

  // Test 1: computeStructuredTelemetry unit matrix across stages 1 through 5
  console.log('Test 1: computeStructuredTelemetry stage 1-5 matrix');
  const { computeStructuredTelemetry } = importQueueRepository;

  // Stage 1: Parsing
  const t1 = computeStructuredTelemetry({
    status: 'running',
    progress: 10,
    stage: 'parse',
    stages: { parse: { status: 'running' } }
  });
  assert.strictEqual(t1.currentStage, 1);
  assert.strictEqual(t1.stageName, 'Parsing');
  assert.strictEqual(t1.progressPercentage, 10);

  // Stage 2: Indexing
  const t2 = computeStructuredTelemetry({
    status: 'running',
    progress: 25,
    stage: 'index',
    stages: {
      parse: { status: 'done' },
      index: { status: 'running' }
    }
  });
  assert.strictEqual(t2.currentStage, 2);
  assert.strictEqual(t2.stageName, 'Indexing');

  // Stage 3: Classifying
  const t3 = computeStructuredTelemetry({
    status: 'running',
    progress: 45,
    stage: 'classify',
    stages: {
      parse: { status: 'done' },
      index: { status: 'done' },
      classify: { status: 'running' }
    }
  });
  assert.strictEqual(t3.currentStage, 3);
  assert.strictEqual(t3.stageName, 'Classifying');

  // Stage 4: Planning (outline / blueprint)
  const t4 = computeStructuredTelemetry({
    status: 'running',
    progress: 60,
    stage: 'outline',
    stages: {
      parse: { status: 'done' },
      index: { status: 'done' },
      classify: { status: 'done' },
      outline: { status: 'running' }
    }
  });
  assert.strictEqual(t4.currentStage, 4);
  assert.strictEqual(t4.stageName, 'Planning');

  // Stage 5: Synthesizing
  const t5 = computeStructuredTelemetry({
    status: 'running',
    progress: 85,
    stage: 'synthesis',
    stages: {
      parse: { status: 'done' },
      index: { status: 'done' },
      classify: { status: 'done' },
      outline: { status: 'done' },
      synthesis: { status: 'running' }
    }
  });
  assert.strictEqual(t5.currentStage, 5);
  assert.strictEqual(t5.stageName, 'Synthesizing');

  // Completed State: should clamp to Stage 5, Synthesizing, 100%
  const tComplete = computeStructuredTelemetry({
    status: 'completed',
    progress: 100,
    stage: 'synthesis',
    stages: {
      parse: { status: 'done' },
      index: { status: 'done' },
      classify: { status: 'done' },
      outline: { status: 'done' },
      synthesis: { status: 'done' }
    }
  });
  assert.strictEqual(tComplete.currentStage, 5);
  assert.strictEqual(tComplete.stageName, 'Synthesizing');
  assert.strictEqual(tComplete.progressPercentage, 100);

  console.log('✓ Test 1 passed: 1-5 stage mapping verified');

  // Test 2: UI Desync Bug Reproduction & Prevention
  // Scenario: Backend finishes classify. Outline is skipped. Backend moves to synthesis.
  // Previously, task.stage remained stuck on 'classify'.
  console.log('Test 2: Desync Bug Prevention (Classify -> Skipped Planning -> Synthesis)');
  const desyncTask = {
    status: 'running',
    progress: 75,
    stage: 'classify', // Old bug: this wasn't updated because outline was skipped
    stages: {
      parse: { status: 'done' },
      index: { status: 'done' },
      classify: { status: 'done' },
      outline: { status: 'skipped' },
      synthesis: { status: 'running' }
    }
  };
  const fixedTelemetry = computeStructuredTelemetry(desyncTask);
  assert.strictEqual(fixedTelemetry.currentStage, 5, 'Must be stage 5 (Synthesizing), NOT stage 3 (Classifying)');
  assert.strictEqual(fixedTelemetry.stageName, 'Synthesizing');
  console.log('✓ Test 2 passed: UI desync avoided — accurately identified Stage 5');

  // Test 3: Ingestion Log Ring Buffer
  console.log('Test 3: Log ring buffer in importQueueService');
  const taskId = 'test-task-telemetry-001';
  importQueueService.addLog(taskId, 'Starting ingestion pipeline', 'info');
  importQueueService.addLog(taskId, 'Parsing structural blocks', 'info');
  importQueueService.addLog(taskId, 'BGE-M3 embedding generated', 'info');

  const logs = importQueueService.getLogs(taskId);
  assert.strictEqual(logs.length, 3, 'Should have 3 logs');
  assert.strictEqual(logs[0].message, 'Starting ingestion pipeline');
  assert.strictEqual(logs[2].message, 'BGE-M3 embedding generated');
  console.log('✓ Test 3 passed: Ingestion log ring buffer verified');

  // Test 4: Repository Event Emission and SSE Integration
  console.log('Test 4: Repository telemetry events and SSE dispatch');
  let receivedEvent = null;
  const listener = (task) => {
    receivedEvent = task;
  };
  importQueueRepository.on('task_created', listener);

  const createdTask = importQueueRepository.create({
    type: 'paste',
    source_title: 'Telemetry Test Document',
    source_meta: { text: 'Some sample content for telemetry verification.' },
    status: 'queued'
  });

  assert(receivedEvent, 'task_created event should have been emitted');
  assert.strictEqual(receivedEvent.id, createdTask.id);
  assert.strictEqual(typeof receivedEvent.currentStage, 'number');
  assert.strictEqual(typeof receivedEvent.stageName, 'string');
  assert.strictEqual(typeof receivedEvent.progressPercentage, 'number');
  importQueueRepository.off('task_created', listener);

  // Update stage and verify update event carries fresh telemetry
  let updatedEvent = null;
  const updateListener = (task) => {
    updatedEvent = task;
  };
  importQueueRepository.on('task_updated', updateListener);

  importQueueRepository.updateStage(createdTask.id, 'index', 'running');
  assert(updatedEvent, 'task_updated event should have been emitted');
  assert.strictEqual(updatedEvent.currentStage, 2, 'Stage should be 2 (Indexing)');
  assert.strictEqual(updatedEvent.stageName, 'Indexing');
  importQueueRepository.off('task_updated', updateListener);
  console.log('✓ Test 4 passed: Repository event emission and telemetry attachment verified');

  // Test 5: SSE Broadcast Client Management
  console.log('Test 5: SSE client registration and event delivery');
  const mockSseClient = {
    written: [],
    write(str) {
      this.written.push(str);
    },
    on(event, cb) {
      if (event === 'close') this.closeCb = cb;
    }
  };

  importQueueService.addSSEClient(mockSseClient);
  assert.strictEqual(importQueueService.sseClients.size, 1);

  // Broadcast a telemetry event
  importQueueService.broadcastTelemetry(createdTask.id);
  assert(mockSseClient.written.length > 0, 'SSE client should have received data');
  const sseChunk = mockSseClient.written[0];
  assert(sseChunk.includes('event: telemetry\n'), 'SSE event name should be telemetry');
  assert(sseChunk.includes('"currentStage":2'), 'SSE payload should contain currentStage: 2');

  // Broadcast a log event
  importQueueService.addLog(createdTask.id, 'Test log message via SSE', 'info');
  const logChunk = mockSseClient.written.find(c => c.includes('event: log\n'));
  assert(logChunk, 'SSE client should have received log event');
  assert(logChunk.includes('Test log message via SSE'));

  // Disconnect client
  importQueueService.removeSSEClient(mockSseClient);
  assert.strictEqual(importQueueService.sseClients.size, 0, 'Client should be unregistered on close');
  console.log('✓ Test 5 passed: SSE client streaming and event serialization verified');

  // Test 6: Cancelled and Failed tasks report correct stage and status
  console.log('Test 6: Cancelled and Failed tasks telemetry');
  const failedTask = {
    status: 'failed',
    progress: 45,
    stage: 'classify',
    stages: {
      parse: { status: 'done' },
      index: { status: 'done' },
      classify: { status: 'failed' }
    }
  };
  const failedTelemetry = computeStructuredTelemetry(failedTask);
  assert.strictEqual(failedTelemetry.currentStage, 3);
  assert.strictEqual(failedTelemetry.status, 'failed');

  const cancelledTask = {
    status: 'cancelled',
    progress: 25,
    stage: 'index',
    stages: {
      parse: { status: 'done' },
      index: { status: 'cancelled' }
    }
  };
  const cancelledTelemetry = computeStructuredTelemetry(cancelledTask);
  assert.strictEqual(cancelledTelemetry.currentStage, 2);
  assert.strictEqual(cancelledTelemetry.status, 'cancelled');
  console.log('✓ Test 6 passed: Failed and cancelled tasks structured telemetry verified');

  // Test 7: Multiple active running stages resolve to highest stage (no first-match bias)
  console.log('Test 7: Multiple running stages resolution');
  const multiRunningTask = {
    status: 'running',
    progress: 65,
    stages: [
      { stage: 'classify', status: 'running' },
      { stage: 'outline', status: 'running' }
    ]
  };
  const multiRunningTelemetry = computeStructuredTelemetry(multiRunningTask);
  assert.strictEqual(multiRunningTelemetry.currentStage, 4, 'Should resolve to highest running stage (4: Planning)');
  console.log('✓ Test 7 passed: Highest running stage resolved without first-element bias');

  // Test 8: Pipeline console output intercepted into real-time log buffer
  console.log('Test 8: Real-time pipeline console log interception');
  console.log('[Pipeline] Stage 4/5: OUTLINE complete in 1.82s');
  console.log('[SemanticChunker] 24 semantic chunks structured');
  const recentLogs = importQueueService.getLogs(null, 10);
  const foundPipelineLog = recentLogs.find(l => l.message.includes('[Pipeline] Stage 4/5: OUTLINE complete'));
  const foundChunkerLog = recentLogs.find(l => l.message.includes('[SemanticChunker] 24 semantic chunks'));
  assert(foundPipelineLog, 'Pipeline log should be captured in log buffer');
  assert(foundChunkerLog, 'Semantic chunker log should be captured in log buffer');
  console.log('✓ Test 8 passed: Real-time console logs intercepted for technical stream');

  console.log('====================================================');
  console.log('🎉 ALL TELEMETRY & STEPPER SYNC VERIFICATIONS PASSED!');
  console.log('====================================================');

  // Clean up test db
  try {
    const dbPath = path.resolve(process.env.DB_PATH);
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
    if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
  } catch (_) {}
}

runTelemetrySyncTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
