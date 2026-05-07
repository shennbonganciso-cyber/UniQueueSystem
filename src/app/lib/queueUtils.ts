import type { QueueTicket, ServiceType } from "./queueApi";

export const SERVICE_DETAILS: Record<ServiceType, { title: string; serviceName: string; prefix: string }> = {
  consultation: {
    title: "Medical Consultation",
    serviceName: "Consultation",
    prefix: "M",
  },
  documentation: {
    title: "Administrative Request",
    serviceName: "Administrative Request",
    prefix: "D",
  },
};

export function getQueueNumberValue(queueNumber: string) {
  const value = Number(queueNumber.split("-")[1]);
  return Number.isFinite(value) ? value : 0;
}

export function sortByQueueNumber(tickets: QueueTicket[]) {
  return [...tickets].sort((a, b) => getQueueNumberValue(a.queueNumber) - getQueueNumberValue(b.queueNumber));
}

export function getNowServing(tickets: QueueTicket[], serviceType: ServiceType) {
  const serving = sortByQueueNumber(tickets).find(
    (ticket) => ticket.serviceType === serviceType && ticket.status === "serving"
  );

  return serving?.queueNumber ?? "None";
}

export function getPeopleAhead(tickets: QueueTicket[], ticket: QueueTicket) {
  return tickets.filter(
    (item) =>
      item.serviceType === ticket.serviceType &&
      item.status === "waiting" &&
      getQueueNumberValue(item.queueNumber) < getQueueNumberValue(ticket.queueNumber)
  ).length;
}

export function getWaitTime(ticket: QueueTicket) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(ticket.createdAt).getTime()) / 60000));
  return `${minutes}m`;
}

export function formatTime(dateValue: string) {
  return new Date(dateValue).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
