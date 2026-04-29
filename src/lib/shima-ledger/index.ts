// Internal module name: shima-ledger
// UI label: 端数残高 (micro-wallet for fractional milli-jpy accumulation)
// DO NOT display "シマエナガ通帳" in any UI surface.

export interface MicroBalance {
  totalMilliJpy: number;
  displayJpy: number;
  threshold: number;
  autoWithdraw: boolean;
}

export interface WithdrawalEntry {
  id: string;
  amountMilliJpy: number;
  at: string;
}

// ─── In-memory store (replace with DB in production) ─────────────────────────

const balances = new Map<string, number>();
const autoWithdrawFlags = new Map<string, boolean>();
const thresholds = new Map<string, number>();
const withdrawalLog = new Map<string, WithdrawalEntry[]>();

const DEFAULT_THRESHOLD = 1_000; // ¥1,000

// ─── Core API ─────────────────────────────────────────────────────────────────

export function accumulate(handle: string, amountMilliJpy: number): MicroBalance {
  const current = balances.get(handle) ?? 0;
  const next = current + amountMilliJpy;
  balances.set(handle, next);

  const threshold = thresholds.get(handle) ?? DEFAULT_THRESHOLD;
  const autoWithdraw = autoWithdrawFlags.get(handle) ?? false;

  if (autoWithdraw && milliToJpy(next) >= threshold) {
    return triggerWithdraw(handle);
  }

  return getMicroBalance(handle);
}

export function getMicroBalance(handle: string): MicroBalance {
  const totalMilliJpy = balances.get(handle) ?? 0;
  return {
    totalMilliJpy,
    displayJpy: milliToJpy(totalMilliJpy),
    threshold: thresholds.get(handle) ?? DEFAULT_THRESHOLD,
    autoWithdraw: autoWithdrawFlags.get(handle) ?? false,
  };
}

export function triggerWithdraw(handle: string): MicroBalance {
  const current = balances.get(handle) ?? 0;
  const entry: WithdrawalEntry = {
    id: `wd_${handle}_${Date.now()}`,
    amountMilliJpy: current,
    at: new Date().toISOString(),
  };

  const log = withdrawalLog.get(handle) ?? [];
  log.unshift(entry);
  withdrawalLog.set(handle, log.slice(0, 50));
  balances.set(handle, 0);

  return getMicroBalance(handle);
}

export function setAutoWithdraw(handle: string, enabled: boolean): MicroBalance {
  autoWithdrawFlags.set(handle, enabled);
  return getMicroBalance(handle);
}

export function setThreshold(handle: string, thresholdJpy: number): MicroBalance {
  thresholds.set(handle, thresholdJpy);
  return getMicroBalance(handle);
}

export function getWithdrawalHistory(handle: string): WithdrawalEntry[] {
  return withdrawalLog.get(handle) ?? [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function milliToJpy(milliJpy: number): number {
  return milliJpy / 1_000;
}

export function jpyToMilli(jpy: number): number {
  return Math.round(jpy * 1_000);
}

export function formatMilliJpy(milliJpy: number): string {
  const jpy = milliToJpy(milliJpy);
  const intPart = Math.floor(jpy).toLocaleString("ja-JP");
  const fracPart = (jpy % 1).toFixed(3).slice(1); // ".xxx"
  return `¥${intPart}${fracPart}`;
}

// ─── Reset (test helper) ──────────────────────────────────────────────────────

export function _resetAll(): void {
  balances.clear();
  autoWithdrawFlags.clear();
  thresholds.clear();
  withdrawalLog.clear();
}
