export interface IncomeEvent {
  recipeId: string;
  amountJpy: number;
  callerType: "agent" | "human" | "big-ai";
  ts: string;
}

export interface IncomeStreamClient {
  subscribe(callback: (event: IncomeEvent) => void): void;
  unsubscribe(callback: (event: IncomeEvent) => void): void;
}

const AMOUNTS = [0.05, 0.12, 0.35, 0.7, 0.9, 1.2, 2.5, 4.8, 0.18, 0.55];
const CALLER_TYPES: IncomeEvent["callerType"][] = ["agent", "agent", "agent", "human", "big-ai"];
const RECIPE_IDS = ["recipe_001", "recipe_002", "recipe_003", "recipe_004", "recipe_005", "recipe_006"];

class MockIncomeStream implements IncomeStreamClient {
  private listeners = new Set<(e: IncomeEvent) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private rng = 0;

  private next(): number {
    this.rng = ((this.rng * 1664525 + 1013904223) >>> 0);
    return this.rng / 0x100000000;
  }

  private makeEvent(): IncomeEvent {
    return {
      recipeId: RECIPE_IDS[Math.floor(this.next() * RECIPE_IDS.length)],
      amountJpy: AMOUNTS[Math.floor(this.next() * AMOUNTS.length)],
      callerType: CALLER_TYPES[Math.floor(this.next() * CALLER_TYPES.length)],
      ts: new Date().toISOString(),
    };
  }

  private startTimer() {
    const tick = () => {
      if (this.listeners.size > 0) {
        const evt = this.makeEvent();
        this.listeners.forEach((cb) => cb(evt));
      }
      this.timer = setTimeout(tick, 800 + Math.floor(this.next() * 700)) as unknown as ReturnType<typeof setInterval>;
    };
    this.timer = setTimeout(tick, 800 + Math.floor(this.next() * 700)) as unknown as ReturnType<typeof setInterval>;
  }

  subscribe(callback: (event: IncomeEvent) => void): void {
    this.listeners.add(callback);
    if (this.listeners.size === 1) this.startTimer();
  }

  unsubscribe(callback: (event: IncomeEvent) => void): void {
    this.listeners.delete(callback);
    if (this.listeners.size === 0 && this.timer !== null) {
      clearTimeout(this.timer as unknown as ReturnType<typeof setTimeout>);
      this.timer = null;
    }
  }

  _fireForTest(event?: Partial<IncomeEvent>): void {
    const base = this.makeEvent();
    const evt: IncomeEvent = { ...base, ...event };
    this.listeners.forEach((cb) => cb(evt));
  }
}

export const incomeStream: IncomeStreamClient & { _fireForTest(e?: Partial<IncomeEvent>): void } =
  new MockIncomeStream();
