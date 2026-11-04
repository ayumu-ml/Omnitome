import React from 'react';
import {
  Check,
  Loader2,
  FileText,
  Cpu,
  Tag,
  Compass,
  Sparkles,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { Job, ImportTask, PipelineStageNumber, PipelineStageName } from '../../types/domain';

export interface PipelineStepperProps {
  currentStage?: number;
  stageName?: string;
  progressPercentage?: number;
  status?: string;
  errorMessage?: string | null;
  task?: ImportTask | null;
  jobs?: Job[];
  activeJob?: Job | null;
  orientation?: 'horizontal' | 'vertical' | 'responsive';
  showProgressTrack?: boolean;
  className?: string;
}

interface StepNodeDef {
  index: PipelineStageNumber;
  title: PipelineStageName;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PIPELINE_NODES: StepNodeDef[] = [
  { index: 1, title: 'Parsing', subtitle: 'Blocks & Structure', icon: FileText },
  { index: 2, title: 'Indexing', subtitle: 'BGE-M3 Vectors', icon: Cpu },
  { index: 3, title: 'Classifying', subtitle: 'Taxonomy & Archetype', icon: Tag },
  { index: 4, title: 'Planning', subtitle: 'Editorial Blueprint', icon: Compass },
  { index: 5, title: 'Synthesizing', subtitle: 'Loss-Bounded Omni', icon: Sparkles },
];

export function PipelineStepper({
  currentStage,
  stageName,
  progressPercentage,
  status: statusProp,
  errorMessage,
  task,
  jobs = [],
  activeJob,
  orientation = 'responsive',
  showProgressTrack = true,
  className = '',
}: PipelineStepperProps) {
  // 1. Resolve completion and failure states
  let isComplete = false;
  let isFailed = false;
  let isInterrupted = false;
  let isCancelled = false;

  // Resolve status from props or task or jobs
  const resolvedStatus = (statusProp || task?.status || (activeJob ? activeJob.status : '')).toLowerCase();
  if (resolvedStatus === 'completed') {
    isComplete = true;
  } else if (resolvedStatus === 'failed') {
    isFailed = true;
  } else if (resolvedStatus === 'interrupted') {
    isInterrupted = true;
  } else if (resolvedStatus === 'cancelled') {
    isCancelled = true;
  }

  // Fallback to jobs array if task is not provided
  if (!task && jobs.length > 0 && !activeJob) {
    const hasCompletedAny = jobs.some((j) => j.status === 'COMPLETED');
    const hasFailedAny = jobs.some((j) => j.status.toLowerCase() === 'failed');
    const hasInterruptedAny = jobs.some((j) => j.status.toUpperCase() === 'INTERRUPTED');
    if (hasCompletedAny && !hasFailedAny && !hasInterruptedAny) {
      isComplete = true;
    } else if (hasFailedAny) {
      isFailed = true;
    } else if (hasInterruptedAny) {
      isInterrupted = true;
    }
  }

  // 2. Resolve currentStage (integer 1 - 5)
  let resolvedStage: PipelineStageNumber = 1;

  if (typeof currentStage === 'number' && currentStage >= 1 && currentStage <= 5) {
    resolvedStage = Math.round(currentStage) as PipelineStageNumber;
  } else if (task && typeof task.currentStage === 'number' && task.currentStage >= 1 && task.currentStage <= 5) {
    resolvedStage = task.currentStage;
  } else if (activeJob) {
    const jobType = activeJob.type;
    if (jobType === 'INGEST' || jobType === 'WEB_IMPORT') resolvedStage = 1;
    else if (jobType === 'SEMANTIC_INDEX') resolvedStage = 2;
    else if (jobType === 'CLASSIFICATION') resolvedStage = 3;
    else if (jobType === 'SYNOPSIS' || jobType === 'OUTLINE') resolvedStage = 4;
    else if (jobType === 'SYNTHESIS') resolvedStage = 5;
  } else if (task?.stage) {
    const s = task.stage;
    if (['synthesis', 'synthesizing', 'attribution', 'ready', 'done'].includes(s)) resolvedStage = 5;
    else if (['outline', 'synopsis', 'planning'].includes(s)) resolvedStage = 4;
    else if (['classify', 'classification'].includes(s)) resolvedStage = 3;
    else if (['semantic_index', 'indexing'].includes(s)) resolvedStage = 2;
    else resolvedStage = 1;
  }

  if (isComplete) {
    resolvedStage = 5;
  }

  // 3. Resolve stage name and progress
  const resolvedStageName =
    stageName || task?.stageName || PIPELINE_NODES[resolvedStage - 1]?.title || 'Parsing';
  const resolvedProgress = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        progressPercentage ??
          task?.progressPercentage ??
          task?.progress ??
          (isComplete ? 100 : (resolvedStage - 1) * 20 + 10)
      )
    )
  );

  return (
    <div
      className={`w-full flex flex-col gap-4 select-none ${className}`}
      role="region"
      aria-label="Document ingestion pipeline progress"
    >
      {/* ── Status Header & Badges ── */}
      <div className="flex items-center justify-between gap-3 text-ui-sm">
        <div className="flex items-center gap-2 min-w-0">
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>Pipeline Complete</span>
            </span>
          ) : isFailed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-err/15 text-err border border-err/30">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Processing Failed</span>
            </span>
          ) : isInterrupted ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warn/15 text-warn border border-warn/30">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Interrupted</span>
            </span>
          ) : isCancelled ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-line text-ink-muted border border-line">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cancelled</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/40 shadow-[0_0_12px_rgba(168,85,247,0.35)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-400" />
              </span>
              <span>Stage {resolvedStage} of 5 · {resolvedStageName}</span>
            </span>
          )}

          {errorMessage && (
            <span className="text-caption text-err truncate max-w-xs" title={errorMessage}>
              {errorMessage}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-ink-muted shrink-0">
          <span className={isComplete ? 'text-emerald-400 font-bold' : isFailed ? 'text-err font-bold' : isCancelled ? 'text-ink-muted font-bold' : 'text-violet-700 dark:text-violet-300 font-bold'}>
            {resolvedProgress}%
          </span>
        </div>
      </div>

      {/* ── 5-Node Grand Stepper Timeline ── */}
      <div
        className={`w-full relative ${
          orientation === 'vertical'
            ? 'flex flex-col gap-3'
            : orientation === 'horizontal'
            ? 'flex items-start justify-between'
            : 'flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0'
        }`}
      >
        {PIPELINE_NODES.map((node, idx) => {
          const isTerminalHalt = isFailed || isInterrupted || isCancelled;
          const isNodeDone = isComplete || node.index < resolvedStage;
          const isNodeActive = !isComplete && !isTerminalHalt && node.index === resolvedStage;
          const isNodeFailed = isFailed && node.index === resolvedStage;
          const isNodeCancelled = isCancelled && node.index === resolvedStage;
          const isNodeInterrupted = isInterrupted && node.index === resolvedStage;
          const hasNext = idx < PIPELINE_NODES.length - 1;

          // Connector state leading to the next node
          const isConnectorDone = isComplete || node.index < resolvedStage - 1;
          const isConnectorActive = !isComplete && !isTerminalHalt && node.index === resolvedStage - 1;
          const isConnectorFailed = isFailed && node.index === resolvedStage - 1;
          const isConnectorHalted = (isCancelled || isInterrupted) && node.index === resolvedStage - 1;

          const NodeIcon = node.icon;

          return (
            <div
              key={node.index}
              className={`relative flex ${
                orientation === 'vertical'
                  ? 'flex-row items-center gap-3.5 w-full py-1.5'
                  : 'flex-1 flex-col items-center text-center'
              }`}
            >
              {/* Connector line for horizontal layout */}
              {hasNext && orientation !== 'vertical' && (
                <div
                  className="absolute top-5 left-1/2 w-full h-[2px] -translate-y-1/2 pointer-events-none z-0 hidden sm:block"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full transition-all duration-500 ${
                      isConnectorDone
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : isConnectorActive
                        ? 'bg-gradient-to-r from-emerald-500 via-[#a855f7] to-[#a855f7]/40 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                        : isConnectorFailed
                        ? 'bg-err/70 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                        : isConnectorHalted
                        ? 'bg-line/80'
                        : 'bg-line/60'
                    }`}
                  />
                </div>
              )}

              {/* Vertical connector line (vertical mode or mobile stacked view) */}
              {hasNext && (orientation === 'vertical' || orientation === 'responsive') && (
                <div
                  className={`absolute top-9 left-5 w-[2px] h-6 -translate-x-1/2 pointer-events-none z-0 ${
                    orientation === 'responsive' ? 'sm:hidden' : ''
                  }`}
                  aria-hidden="true"
                >
                  <div
                    className={`w-full h-full transition-all duration-500 ${
                      isConnectorDone
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : isConnectorActive
                        ? 'bg-gradient-to-b from-emerald-500 to-[#a855f7] shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                        : isConnectorFailed
                        ? 'bg-err/70 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                        : isConnectorHalted
                        ? 'bg-line/80'
                        : 'bg-line/60'
                    }`}
                  />
                </div>
              )}

              {/* Node Circle */}
              <div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                  isNodeDone
                    ? 'bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.45)] ring-2 ring-emerald-400/40'
                    : isNodeActive
                    ? 'bg-violet-500/15 dark:bg-violet-950/80 border-2 border-[#a855f7] text-violet-600 dark:text-[#c084fc] shadow-[0_0_22px_rgba(168,85,247,0.7),inset_0_0_10px_rgba(168,85,247,0.3)] animate-pulse ring-2 ring-[#a855f7]/30'
                    : isNodeFailed
                    ? 'bg-err/15 border-2 border-err text-err shadow-[0_0_16px_rgba(239,68,68,0.4)]'
                    : isNodeCancelled
                    ? 'bg-line/20 border-2 border-line text-ink-muted shadow-xs'
                    : isNodeInterrupted
                    ? 'bg-warn/15 border-2 border-warn text-warn shadow-[0_0_14px_rgba(234,179,8,0.3)]'
                    : 'bg-surface/70 border border-line text-ink-muted/40'
                }`}
                aria-label={`${node.title} stage: ${
                  isNodeDone ? 'completed' : isNodeActive ? 'active' : isNodeFailed ? 'failed' : isNodeCancelled ? 'cancelled' : isNodeInterrupted ? 'interrupted' : 'pending'
                }`}
              >
                {isNodeDone ? (
                  <Check className="w-5 h-5 stroke-[3] text-white" aria-hidden="true" />
                ) : isNodeActive ? (
                  <Loader2 className="w-5 h-5 animate-spin text-violet-600 dark:text-[#c084fc]" aria-hidden="true" />
                ) : isNodeFailed ? (
                  <AlertCircle className="w-5 h-5 text-err" aria-hidden="true" />
                ) : isNodeCancelled || isNodeInterrupted ? (
                  <AlertTriangle className="w-5 h-5 text-ink-muted" aria-hidden="true" />
                ) : (
                  <NodeIcon className="w-4 h-4 text-ink-muted/50" aria-hidden="true" />
                )}
              </div>

              {/* Node Text & Subtitle */}
              <div
                className={`min-w-0 ${
                  orientation === 'vertical' ? 'text-left pl-1' : 'mt-2 text-center'
                }`}
              >
                <p
                  className={`text-ui-sm leading-tight transition-colors ${
                    isNodeDone
                      ? 'font-medium text-ink'
                      : isNodeActive
                      ? 'font-semibold text-violet-700 dark:text-violet-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      : isNodeFailed
                      ? 'font-medium text-err'
                      : isNodeCancelled || isNodeInterrupted
                      ? 'font-medium text-ink-muted'
                      : 'text-ink-muted/50'
                  }`}
                >
                  {node.title}
                </p>
                <p
                  className={`text-[11px] font-mono mt-0.5 truncate ${
                    isNodeActive
                      ? 'text-violet-600 dark:text-violet-400 font-medium'
                      : isNodeDone
                      ? 'text-ink-muted/70'
                      : 'text-ink-muted/40'
                  }`}
                >
                  {node.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sub-hairline progress track ── */}
      {showProgressTrack && (
        <div className="w-full h-1 bg-surface rounded-full overflow-hidden border border-line/50 mt-1">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              isComplete
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : isFailed
                ? 'bg-err shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                : isCancelled
                ? 'bg-ink-muted/50'
                : 'bg-gradient-to-r from-emerald-500 via-violet-500 to-[#c084fc] shadow-[0_0_12px_rgba(168,85,247,0.6)]'
            }`}
            style={{ width: `${resolvedProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default PipelineStepper;
