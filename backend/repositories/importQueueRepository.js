const EventEmitter = require('events');
const { getDatabase } = require('../db/database');

const STAGE_WEIGHTS = {
  ingest: 15,
  parse: 15,
  semantic_index: 30,
  index: 30,
  classify: 45,
  outline: 55,
  synopsis: 60,
  synthesis: 70,
  attribution: 85,
  done: 100,
};

const STAGE_LABELS = {
  ingest: 'Importing content…',
  parse: 'Parsing content & structure…',
  semantic_index: 'Indexing semantic memory…',
  index: 'Indexing semantic memory…',
  classify: 'Classifying document…',
  outline: 'Building editorial outline…',
  synopsis: 'Writing synopsis…',
  synthesis: 'Compressing chapters…',
  attribution: 'Tracing sources & attributions…',
  done: 'Ready to read',
};

const STAGE_ORDER_MAP = {
  // Stage 1: Parsing
  preparing: 1,
  acquiring: 1,
  extracting: 1,
  structuring: 1,
  ingest: 1,
  parse: 1,
  parsing: 1,
  // Stage 2: Indexing
  semantic_index: 2,
  index: 2,
  indexing: 2,
  vectorizing: 2,
  // Stage 3: Classifying
  classify: 3,
  classification: 3,
  classifying: 3,
  taxonomy: 3,
  // Stage 4: Planning
  outline: 4,
  synopsis: 4,
  planning: 4,
  plan: 4,
  blueprint: 4,
  editorial: 4,
  // Stage 5: Synthesizing
  synthesis: 5,
  synthesizing: 5,
  synthesize: 5,
  compressing: 5,
  attribution: 5,
  ready: 5,
  done: 5,
};

const STAGE_NAMES = {
  1: 'Parsing',
  2: 'Indexing',
  3: 'Classifying',
  4: 'Planning',
  5: 'Synthesizing',
};

/**
 * Computes canonical 1-5 structured telemetry for any import task.
 * @param {object} task
 * @returns {{ taskId: string|null, currentStage: number, stageName: string, progressPercentage: number, status: string }}
 */
function computeStructuredTelemetry(task) {
  if (!task) {
    return {
      taskId: null,
      currentStage: 1,
      stageName: 'Parsing',
      progressPercentage: 0,
      status: 'queued',
    };
  }

  const isCompleted = task.status === 'completed';
  if (isCompleted) {
    return {
      taskId: task.id || null,
      currentStage: 5,
      stageName: 'Synthesizing',
      progressPercentage: 100,
      status: 'completed',
    };
  }

  // Normalize stages to an array of { stage, status } regardless of input structure
  let stageList = [];
  if (Array.isArray(task.stages)) {
    stageList = task.stages;
  } else if (Array.isArray(task.stages_json)) {
    stageList = task.stages_json;
  } else if (task.stages && typeof task.stages === 'object') {
    stageList = Object.entries(task.stages).map(([k, v]) => ({
      stage: k,
      status: typeof v === 'object' && v !== null ? v.status : v,
    }));
  } else if (typeof task.stages_json === 'string') {
    try {
      const parsed = JSON.parse(task.stages_json);
      if (Array.isArray(parsed)) {
        stageList = parsed;
      } else if (parsed && typeof parsed === 'object') {
        stageList = Object.entries(parsed).map(([k, v]) => ({
          stage: k,
          status: typeof v === 'object' && v !== null ? v.status : v,
        }));
      }
    } catch {
      stageList = [];
    }
  }

  let determinedStage = 1;

  // 1. Check actively running stage in stageList (pick highest active stage number)
  const runningStages = stageList.filter((s) => s.status === 'running' || s.status === 'in_progress');
  const mappedRunning = runningStages.map((s) => STAGE_ORDER_MAP[s.stage]).filter((n) => typeof n === 'number');
  if (mappedRunning.length > 0) {
    determinedStage = Math.max(...mappedRunning);
  } else {
    // 2. Check task.stage property
    if (task.stage && STAGE_ORDER_MAP[task.stage]) {
      determinedStage = Math.max(determinedStage, STAGE_ORDER_MAP[task.stage]);
    }
    // 3. Check highest completed or skipped stage in stageList
    for (const s of stageList) {
      if ((s.status === 'done' || s.status === 'completed' || s.status === 'skipped') && STAGE_ORDER_MAP[s.stage]) {
        const completedStageNum = STAGE_ORDER_MAP[s.stage];
        determinedStage = Math.max(determinedStage, Math.min(5, completedStageNum + 1));
      }
    }
  }

  // 4. Progress-based guard: prevent stage regression or desync if progress is high
  const rawProgress = typeof task.progress === 'number' ? task.progress : 0;
  if (rawProgress >= 70) {
    determinedStage = Math.max(determinedStage, 5);
  } else if (rawProgress >= 50) {
    determinedStage = Math.max(determinedStage, 4);
  } else if (rawProgress >= 35) {
    determinedStage = Math.max(determinedStage, 3);
  } else if (rawProgress >= 20) {
    determinedStage = Math.max(determinedStage, 2);
  }

  const currentStage = Math.max(1, Math.min(5, determinedStage));
  const stageName = STAGE_NAMES[currentStage] || 'Parsing';

  const stageMinProgress = { 1: 5, 2: 25, 3: 45, 4: 60, 5: 75 };
  let progressPercentage = Math.max(rawProgress, stageMinProgress[currentStage] || 5);
  if (task.status === 'completed') {
    progressPercentage = 100;
  }
  progressPercentage = Math.min(100, Math.max(0, Math.round(progressPercentage)));

  return {
    taskId: task.id || null,
    currentStage,
    stageName,
    progressPercentage,
    status: task.status,
  };
}

class ImportQueueRepository extends EventEmitter {
  constructor() {
    super();
  }

  create({
    id,
    type,
    source_title,
    source_meta = {},
    status = 'queued',
    stage = 'preparing',
    stage_label = 'Queued for processing',
    progress = 0,
    queue_order,
    stages_json,
    stages,
  }) {
    const db = getDatabase();
    const taskId = id || `import-task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    let resolvedOrder = queue_order;
    if (resolvedOrder === undefined || resolvedOrder === null) {
      resolvedOrder = this.getNextQueueOrder();
    }

    const resolvedStages = stages_json !== undefined ? stages_json : stages;
    const metaStr = typeof source_meta === 'object' ? JSON.stringify(source_meta) : (source_meta || '{}');
    const stagesStr = typeof resolvedStages === 'object' && resolvedStages !== null ? JSON.stringify(resolvedStages) : (resolvedStages || '[]');

    db.prepare(`
      INSERT INTO import_queue (
        id, type, source_title, source_meta, status, stage, stage_label,
        progress, queue_order, book_id, error, created_at, started_at, completed_at, stages_json
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      taskId,
      type,
      source_title || 'Untitled Import',
      metaStr,
      status,
      stage,
      stage_label,
      progress,
      resolvedOrder,
      null,
      null,
      now,
      null,
      null,
      stagesStr
    );

    const task = this.getById(taskId);
    if (task) {
      this.emit('task_created', task);
    }
    return task;
  }

  getById(id) {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM import_queue WHERE id = ?').get(id);
    if (!row) return null;
    return this._formatRow(row);
  }

  getAll(limit = 100) {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM import_queue
      ORDER BY
        CASE
          WHEN status IN ('initializing', 'processing') THEN 0
          WHEN status = 'queued' THEN 1
          ELSE 2
        END,
        queue_order ASC,
        created_at DESC
      LIMIT ?
    `).all(limit);
    return rows.map((r) => this._formatRow(r));
  }

  getQueue() {
    const all = this.getAll(150);
    const db = getDatabase();
    const existingBookRows = db.prepare('SELECT id FROM books').all();
    const existingBookIds = new Set(existingBookRows.map((r) => r.id));

    // Filter out completed/failed jobs whose book_id no longer exists in the books table
    const validAll = all.filter((t) => {
      const isFinished = ['completed', 'failed', 'cancelled', 'interrupted'].includes(t.status);
      if (isFinished && t.book_id && !existingBookIds.has(t.book_id)) {
        return false;
      }
      return true;
    });

    const activeTasks = validAll.filter((t) => t.status === 'initializing' || t.status === 'processing');
    const active = activeTasks[0] || null;
    const queued = validAll.filter((t) => t.status === 'queued').sort((a, b) => a.queue_order - b.queue_order);
    const history = validAll.filter((t) => ['completed', 'failed', 'cancelled', 'interrupted'].includes(t.status));

    return {
      active,
      queued,
      history,
      totalCount: validAll.length,
      pendingCount: queued.length + activeTasks.length,
    };
  }

  getNextQueued() {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT * FROM import_queue
      WHERE status = 'queued'
      ORDER BY queue_order ASC, created_at ASC
      LIMIT 1
    `).get();
    return row ? this._formatRow(row) : null;
  }

  getActiveTask() {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT * FROM import_queue
      WHERE status IN ('initializing', 'processing')
      ORDER BY started_at ASC
      LIMIT 1
    `).get();
    return row ? this._formatRow(row) : null;
  }

  update(id, updates) {
    const db = getDatabase();
    const current = this.getById(id);
    if (!current) return null;

    const merged = {
      ...current,
      ...updates,
    };

    if (updates.source_meta !== undefined && typeof updates.source_meta === 'object') {
      merged.source_meta = JSON.stringify(updates.source_meta);
    } else if (typeof merged.source_meta === 'object') {
      merged.source_meta = JSON.stringify(merged.source_meta);
    }

    if (updates.stages_json !== undefined && typeof updates.stages_json === 'object') {
      merged.stages_json = JSON.stringify(updates.stages_json);
    } else if (typeof merged.stages_json === 'object') {
      merged.stages_json = JSON.stringify(merged.stages_json);
    }

    db.prepare(`
      UPDATE import_queue
      SET status = @status,
          stage = @stage,
          stage_label = @stage_label,
          progress = @progress,
          queue_order = @queue_order,
          book_id = @book_id,
          error = @error,
          source_meta = @source_meta,
          stages_json = @stages_json,
          started_at = @started_at,
          completed_at = @completed_at
      WHERE id = @id
    `).run(merged);

    const updated = this.getById(id);
    if (updated) {
      this.emit('task_updated', updated);
    }
    return updated;
  }

  updateStage(id, stageName, status) {
    if (!id) return null;
    const task = this.getById(id);
    if (!task) return null;
    const currentStages = Array.isArray(task.stages) ? [...task.stages] : [];
    const now = new Date().toISOString();
    const existingIdx = currentStages.findIndex((s) => s.stage === stageName);
    if (existingIdx >= 0) {
      currentStages[existingIdx] = {
        ...currentStages[existingIdx],
        status,
        started_at: status === 'running' ? now : (currentStages[existingIdx].started_at || now),
        completed_at: ['done', 'failed', 'skipped'].includes(status) ? now : currentStages[existingIdx].completed_at,
      };
    } else {
      currentStages.push({
        stage: stageName,
        status,
        started_at: now,
        completed_at: ['done', 'failed', 'skipped'].includes(status) ? now : null,
      });
    }

    let newProgress = task.progress || 0;
    const updates = {
      stages_json: currentStages,
    };

    if (status === 'running' && STAGE_WEIGHTS[stageName] !== undefined) {
      newProgress = STAGE_WEIGHTS[stageName];
      updates.stage = stageName;
      if (STAGE_LABELS[stageName]) {
        updates.stage_label = STAGE_LABELS[stageName];
      }
    } else if (status === 'done' && STAGE_WEIGHTS[stageName] !== undefined) {
      newProgress = Math.max(newProgress, STAGE_WEIGHTS[stageName] + 5);
    }
    updates.progress = Math.min(100, newProgress);

    return this.update(id, updates);
  }

  delete(id) {
    const db = getDatabase();
    const info = db.prepare('DELETE FROM import_queue WHERE id = ?').run(id);
    return info.changes > 0;
  }

  getNextQueueOrder() {
    const db = getDatabase();
    const maxRow = db.prepare(`
      SELECT COALESCE(MAX(queue_order), 0) AS max_order
      FROM import_queue
      WHERE status IN ('queued', 'initializing', 'processing')
    `).get();
    return (maxRow?.max_order || 0) + 1;
  }

  clearCompleted() {
    const db = getDatabase();
    try {
      const rows = db.prepare(`
        SELECT source_meta FROM import_queue
        WHERE status IN ('completed', 'cancelled', 'failed', 'interrupted')
      `).all();
      const fs = require('fs');
      for (const row of rows) {
        try {
          const meta = typeof row.source_meta === 'string' ? JSON.parse(row.source_meta || '{}') : (row.source_meta || {});
          if (meta.stagingPath && fs.existsSync(meta.stagingPath)) {
            fs.unlinkSync(meta.stagingPath);
          }
        } catch (_) {}
      }
    } catch (_) {}

    const info = db.prepare(`
      DELETE FROM import_queue
      WHERE status IN ('completed', 'cancelled')
    `).run();
    return info.changes;
  }

  reorder(taskIds = []) {
    if (!Array.isArray(taskIds) || taskIds.length === 0) return;
    const db = getDatabase();

    const updateStmt = db.prepare(`
      UPDATE import_queue
      SET queue_order = ?
      WHERE id = ? AND status = 'queued'
    `);

    db.transaction(() => {
      taskIds.forEach((id, index) => {
        updateStmt.run(index + 1, id);
      });
    })();
  }

  markStaleTasksInterrupted() {
    const db = getDatabase();
    const now = new Date().toISOString();

    const info = db.prepare(`
      UPDATE import_queue
      SET status = 'failed',
          error = COALESCE(error, 'Interrupted by server restart. Retry is safe.'),
          completed_at = ?
      WHERE status IN ('initializing', 'processing')
    `).run(now);

    return info.changes;
  }

  _formatRow(row) {
    let meta = {};
    try {
      meta = typeof row.source_meta === 'string' ? JSON.parse(row.source_meta || '{}') : (row.source_meta || {});
    } catch {
      meta = {};
    }

    let stages = [];
    try {
      stages = typeof row.stages_json === 'string' ? JSON.parse(row.stages_json || '[]') : (row.stages_json || []);
    } catch {
      stages = [];
    }

    const telemetry = computeStructuredTelemetry({ ...row, stages });

    return {
      ...row,
      currentStage: telemetry.currentStage,
      stageName: telemetry.stageName,
      progressPercentage: telemetry.progressPercentage,
      current_stage: telemetry.currentStage,
      stage_name: telemetry.stageName,
      progress_percentage: telemetry.progressPercentage,
      source_meta: meta,
      sourceMeta: meta,
      sourceTitle: row.source_title,
      queueOrder: row.queue_order,
      bookId: row.book_id,
      stageLabel: row.stage_label,
      stages,
      stages_json: stages,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    };
  }
}

const repo = new ImportQueueRepository();
repo.STAGE_WEIGHTS = STAGE_WEIGHTS;
repo.STAGE_LABELS = STAGE_LABELS;
repo.computeStructuredTelemetry = computeStructuredTelemetry;
module.exports = repo;
module.exports.STAGE_WEIGHTS = STAGE_WEIGHTS;
module.exports.STAGE_LABELS = STAGE_LABELS;
module.exports.computeStructuredTelemetry = computeStructuredTelemetry;


