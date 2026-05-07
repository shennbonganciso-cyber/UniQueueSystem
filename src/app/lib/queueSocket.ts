import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./queueApi";

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

export function subscribeToQueueUpdates(onQueueChanged: () => void) {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
  }

  socket.on("queues:changed", onQueueChanged);
  socket.on("connect", onQueueChanged);

  return () => {
    socket?.off("queues:changed", onQueueChanged);
    socket?.off("connect", onQueueChanged);
  };
}
