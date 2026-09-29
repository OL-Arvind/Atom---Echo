import type {
  CommandCenterExpenseItem,
  CommandCenterScheduledPost,
} from "@/types/domain";

export function getScheduledPostFounder(post: CommandCenterScheduledPost): string {
  if (!post.engagements) return "Founder";
  const eng = Array.isArray(post.engagements) ? post.engagements[0] : post.engagements;
  if (!eng || typeof eng !== "object") return "Founder";
  const clients = (eng as Record<string, unknown>).clients;
  if (!clients) return "Founder";
  const client = Array.isArray(clients) ? clients[0] : clients;
  if (!client || typeof client !== "object") return "Founder";
  return ((client as Record<string, unknown>).founder_name as string) || "Founder";
}

export function getExpenseClientId(exp: CommandCenterExpenseItem): string | null {
  if (!exp.engagements) return null;
  const eng = Array.isArray(exp.engagements) ? exp.engagements[0] : exp.engagements;
  if (!eng || typeof eng !== "object") return null;
  const clients = (eng as Record<string, unknown>).clients;
  if (!clients) return null;
  const client = Array.isArray(clients) ? clients[0] : clients;
  if (!client || typeof client !== "object") return null;
  return ((client as Record<string, unknown>).id as string) || null;
}

export function getExpenseClientName(exp: CommandCenterExpenseItem): string {
  if (exp.client) return exp.client;
  if (!exp.engagements) return "Client";
  const eng = Array.isArray(exp.engagements) ? exp.engagements[0] : exp.engagements;
  if (!eng || typeof eng !== "object") return "Client";
  const clients = (eng as Record<string, unknown>).clients;
  if (!clients) return "Client";
  const client = Array.isArray(clients) ? clients[0] : clients;
  if (!client || typeof client !== "object") return "Client";
  return ((client as Record<string, unknown>).name as string) || "Client";
}
