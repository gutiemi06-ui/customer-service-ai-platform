// Since we use SQLite with string fields, these are string literal types
export type Role = "CUSTOMER" | "AGENT" | "ADMIN";
export type Category = "TECHNICAL" | "BILLING" | "ACCOUNT" | "GENERAL";
export type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TicketWithRelations {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  priority: Priority;
  userId: string;
  agentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; email: string };
  agent: { id: string; name: string; email: string } | null;
  messages: MessageWithSender[];
  analytics: TicketAnalyticsData | null;
  _count?: { messages: number };
}

export interface MessageWithSender {
  id: string;
  ticketId: string;
  senderId: string | null;
  content: string;
  isAI: boolean;
  createdAt: Date;
  sender: { id: string; name: string; email: string } | null;
}

export interface TicketAnalyticsData {
  id: string;
  ticketId: string;
  responseTime: number | null;
  resolutionTime: number | null;
  satisfactionScore: number | null;
  createdAt: Date;
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const STATUS_LABELS: Record<Status, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  TECHNICAL: "Technical",
  BILLING: "Billing",
  ACCOUNT: "Account",
  GENERAL: "General",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export const STATUS_COLORS: Record<Status, string> = {
  OPEN: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  TECHNICAL: "bg-purple-100 text-purple-700",
  BILLING: "bg-emerald-100 text-emerald-700",
  ACCOUNT: "bg-sky-100 text-sky-700",
  GENERAL: "bg-gray-100 text-gray-700",
};
