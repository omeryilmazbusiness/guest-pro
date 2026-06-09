const LS_PREFIX = "guest-pro:task-insight-dismissed:";

export function isDailyTaskInsightDismissed(insightId: number): boolean {
  try {
    return localStorage.getItem(`${LS_PREFIX}${insightId}`) === "1";
  } catch {
    return false;
  }
}

export function dismissDailyTaskInsight(insightId: number): void {
  try {
    localStorage.setItem(`${LS_PREFIX}${insightId}`, "1");
  } catch {
    /* ignore */
  }
}
