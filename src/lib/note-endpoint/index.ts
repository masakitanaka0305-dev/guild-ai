const callStore = new Map<string, { count: number; lastCalledAt: string }>();

export interface EndpointStats {
  guildId: string;
  title: string;
  rank: string;
  perCallJpy: number;
  callsTotal24h: number;
  status: "active" | "inactive";
  endpointUrl: string;
}

const PER_CALL_JPY = 1.2;

export function formatEndpointUrl(guildId: string): string {
  return `https://guild-ai.vercel.app/api/note/${guildId}`;
}

export function getEndpointStats(guildId: string): EndpointStats {
  const stored = callStore.get(guildId);
  return {
    guildId,
    title: `ノート ${guildId}`,
    rank: "A",
    perCallJpy: PER_CALL_JPY,
    callsTotal24h: stored?.count ?? 0,
    status: "active",
    endpointUrl: formatEndpointUrl(guildId),
  };
}

export function recordCall(
  guildId: string,
  callerType = "agent",
): { callsTotal24h: number; earnedJpy: number } {
  void callerType;
  const stored = callStore.get(guildId) ?? { count: 0, lastCalledAt: "" };
  stored.count += 1;
  stored.lastCalledAt = new Date().toISOString();
  callStore.set(guildId, stored);
  return { callsTotal24h: stored.count, earnedJpy: PER_CALL_JPY };
}
