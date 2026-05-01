// Job Progress — 3-stage application status management

export type JobStatus = "applied" | "engaged" | "completed";

export interface JobProgress {
  jobId: string;
  handle: string;
  status: JobStatus;
  progressPct: 33 | 66 | 100;
  updatedAt: string;
}

const STATUS_TO_PCT: Record<JobStatus, 33 | 66 | 100> = {
  applied:   33,
  engaged:   66,
  completed: 100,
};

export const STATUS_LABEL: Record<JobStatus, string> = {
  applied:   "エージェント派遣中",
  engaged:   "参画中",
  completed: "完了",
};

// ─── In-memory store (mock) ───────────────────────────────────────────────────

const store = new Map<string, JobProgress>();
let seq = 1;

function key(jobId: string, handle: string): string {
  return `${jobId}:${handle}`;
}

export function applyToJob(jobId: string, handle: string): JobProgress {
  const existing = store.get(key(jobId, handle));
  if (existing) return existing;
  const entry: JobProgress = {
    jobId,
    handle,
    status: "applied",
    progressPct: 33,
    updatedAt: new Date("2026-04-30T09:00:00+09:00").toISOString(),
  };
  store.set(key(jobId, handle), entry);
  seq++;
  return entry;
}

export function advanceStatus(jobId: string, handle: string): JobProgress | null {
  const entry = store.get(key(jobId, handle));
  if (!entry) return null;
  const NEXT: Record<JobStatus, JobStatus | null> = {
    applied:   "engaged",
    engaged:   "completed",
    completed: null,
  };
  const nextStatus = NEXT[entry.status];
  if (!nextStatus) return entry;
  const updated: JobProgress = {
    ...entry,
    status: nextStatus,
    progressPct: STATUS_TO_PCT[nextStatus],
    updatedAt: new Date("2026-04-30T09:00:00+09:00").toISOString(),
  };
  store.set(key(jobId, handle), updated);
  return updated;
}

export function getProgress(jobId: string, handle: string): JobProgress | null {
  return store.get(key(jobId, handle)) ?? null;
}

export function getJobsForHandle(handle: string): JobProgress[] {
  return Array.from(store.values()).filter((j) => j.handle === handle);
}

export function _resetJobProgress(): void {
  store.clear();
  seq = 1;
}
