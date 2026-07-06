type AgentRunJob = {
  agentId: string;
  status: "accepted" | "running" | "success" | "failed";
  startedAt: string;
  result?: unknown;
  error?: string;
};

const jobMap = new Map<string, AgentRunJob>();

export function setAgentRunJob(traceId: string, job: AgentRunJob) {
  jobMap.set(traceId, job);
}

export function getAgentRunJob(traceId: string): AgentRunJob | undefined {
  return jobMap.get(traceId);
}

