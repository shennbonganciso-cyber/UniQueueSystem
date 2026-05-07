import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { Logo } from "./Logo";
import { Footer } from "./Footer";
import { getQueueTickets, type QueueTicket } from "../lib/queueApi";
import { getNowServing, sortByQueueNumber } from "../lib/queueUtils";
import { subscribeToQueueUpdates } from "../lib/queueSocket";

export function QueueMonitoring() {
  const [time, setTime] = useState(new Date());
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [error, setError] = useState("");

  const loadTickets = async () => {
    try {
      setError("");
      setTickets(await getQueueTickets({ date: "today" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load queue monitor");
    }
  };

  useEffect(() => {
    loadTickets();
    const unsubscribe = subscribeToQueueUpdates(loadTickets);
    const queueInterval = window.setInterval(loadTickets, 30000);
    const clockInterval = window.setInterval(() => setTime(new Date()), 1000);

    return () => {
      unsubscribe();
      window.clearInterval(queueInterval);
      window.clearInterval(clockInterval);
    };
  }, []);

  const servingQueue = getNowServing(tickets, "consultation") !== "None"
    ? getNowServing(tickets, "consultation")
    : getNowServing(tickets, "documentation");
  const nextTickets = sortByQueueNumber(tickets).filter((ticket) => ticket.status === "waiting").slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <header className="relative z-10 bg-card/50 backdrop-blur-xl border-b border-white/10 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="md" />
            <div className="border-l border-white/10 pl-4 ml-1">
              <h1 className="text-2xl mb-0.5">University Clinic</h1>
              <p className="text-xs text-slate-400">Queue Monitoring System</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base mb-0.5">{time.toLocaleTimeString()}</p>
            <p className="text-xs text-slate-400">{time.toLocaleDateString()}</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl space-y-4">
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          <div className="relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                <p className="text-base text-slate-300 uppercase tracking-wider">Now Serving</p>
              </div>
              <div className="text-center mb-4">
                <p className="text-8xl leading-none bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {servingQueue}
                </p>
              </div>
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg shadow-indigo-500/50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {nextTickets.map((ticket, idx) => (
              <div key={ticket._id} className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 text-center shadow-xl">
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">
                  {idx === 0 ? "Next" : idx === 1 ? "Upcoming" : "Waiting"}
                </p>
                <p className="text-5xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {ticket.queueNumber}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-2xl p-4 text-center backdrop-blur-sm shadow-xl">
            <p className="text-sm text-slate-200">
              Please listen for your number and proceed to the consultation room when called
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
