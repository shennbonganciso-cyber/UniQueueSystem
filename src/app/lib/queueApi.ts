export type QueueStatus = "waiting" | "serving" | "completed" | "skipped" | "cancelled";
export type ServiceType = "consultation" | "documentation";

export interface QueueTicket {
  _id: string;
  studentName: string;
  studentId: string;
  serviceType: ServiceType;
  serviceName: string;
  queueNumber: string;
  dateKey?: string;
  status: QueueStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQueueTicketInput {
  studentName: string;
  studentId: string;
  serviceType: ServiceType;
  serviceName?: string;
  notes?: string;
}

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "API request failed");
  }

  return response.json() as Promise<T>;
}

export function getQueueTickets(
  params: {
    date?: "today";
    status?: QueueStatus;
    serviceType?: ServiceType;
    studentId?: string;
  } = {}
) {
  const searchParams = new URLSearchParams();

  if (params.date) searchParams.set("date", params.date);
  if (params.status) searchParams.set("status", params.status);
  if (params.serviceType) searchParams.set("serviceType", params.serviceType);
  if (params.studentId) searchParams.set("studentId", params.studentId);

  const query = searchParams.toString();
  return apiRequest<QueueTicket[]>(`/queues${query ? `?${query}` : ""}`);
}

export function getQueueTicket(id: string) {
  return apiRequest<QueueTicket>(`/queues/${id}`);
}

export function createQueueTicket(input: CreateQueueTicketInput) {
  return apiRequest<QueueTicket>("/queues", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateQueueTicket(id: string, input: Partial<QueueTicket>) {
  return apiRequest<QueueTicket>(`/queues/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteQueueTicket(id: string) {
  return apiRequest<{ message: string }>(`/queues/${id}`, {
    method: "DELETE",
  });
}
