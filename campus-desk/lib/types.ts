export type Role = "student" | "staff";
export type Actor = { id: string; name: string; role: Role };
export type Status = "open" | "in_progress" | "resolved";
export const statusLabels: Record<Status, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};
export type Category = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
export type ServiceRequest = {
  id: string;
  title: string;
  location: string;
  status: Status;
  category: { id: string; name: string };
  reporter?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  description?: string;
  resolutionNote?: string;
  resolvedAt?: string | null;
};
export type RequestPage = {
  data: ServiceRequest[];
  page: number;
  pageSize: number;
  total: number;
};
export type Dashboard = {
  counts: { total: number; open: number; inProgress: number; resolved: number };
  recentRequests: ServiceRequest[];
};
