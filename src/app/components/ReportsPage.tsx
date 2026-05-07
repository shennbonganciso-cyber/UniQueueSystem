import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Logo } from "./Logo";
import { Footer } from "./Footer";
import { getQueueTickets, type QueueTicket, type ServiceType } from "../lib/queueApi";
import { formatTime, getWaitTime, SERVICE_DETAILS } from "../lib/queueUtils";
import { subscribeToQueueUpdates } from "../lib/queueSocket";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isInRange(ticket: QueueTicket, range: string) {
  const created = new Date(ticket.createdAt);
  const today = startOfDay(new Date());

  if (range === "today") {
    return created >= today;
  }

  const days = range === "month" ? 30 : 7;
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return created >= start;
}

function getDayLabel(dateValue: string) {
  return new Date(dateValue).toLocaleDateString([], { weekday: "short" });
}

export function ReportsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("today");
  const [serviceFilter, setServiceFilter] = useState<"all" | ServiceType>("all");
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [error, setError] = useState("");

  const loadTickets = async () => {
    try {
      setError("");
      setTickets(await getQueueTickets({ date: "today" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reports");
    }
  };

  useEffect(() => {
    loadTickets();
    const unsubscribe = subscribeToQueueUpdates(loadTickets);
    const fallbackInterval = window.setInterval(loadTickets, 30000);

    return () => {
      unsubscribe();
      window.clearInterval(fallbackInterval);
    };
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesRange = isInRange(ticket, dateRange);
      const matchesService = serviceFilter === "all" || ticket.serviceType === serviceFilter;
      return matchesRange && matchesService;
    });
  }, [dateRange, serviceFilter, tickets]);

  const todayTickets = tickets;
  const completedTickets = filteredTickets.filter((ticket) => ticket.status === "completed");
  const totalPatients = filteredTickets.length;
  const avgWait = filteredTickets.length
    ? Math.round(filteredTickets.reduce((sum, ticket) => sum + Number(getWaitTime(ticket).replace("m", "")), 0) / filteredTickets.length)
    : 0;
  const completionRate = totalPatients ? Math.round((completedTickets.length / totalPatients) * 100) : 0;

  const dailyData = Object.values(
    filteredTickets.reduce<Record<string, { day: string; patients: number; avgWait: number; totalWait: number }>>((acc, ticket) => {
      const day = getDayLabel(ticket.createdAt);
      acc[day] ??= { day, patients: 0, avgWait: 0, totalWait: 0 };
      acc[day].patients += 1;
      acc[day].totalWait += Number(getWaitTime(ticket).replace("m", ""));
      acc[day].avgWait = Math.round(acc[day].totalWait / acc[day].patients);
      return acc;
    }, {}),
  );

  const serviceData = (["consultation", "documentation"] as ServiceType[]).map((serviceType) => {
    const count = filteredTickets.filter((ticket) => ticket.serviceType === serviceType).length;
    return {
      service: SERVICE_DETAILS[serviceType].title,
      count,
      percentage: totalPatients ? Math.round((count / totalPatients) * 100) : 0,
    };
  });

  const recentTransactions = [...filteredTickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col">
      <header className="bg-card/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="border-l border-white/10 pl-3 ml-1">
              <h1 className="text-base">UniQueue</h1>
              <p className="text-xs text-slate-400">Reports & Analytics</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/staff")}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline text-sm">Back to Dashboard</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {error && <p className="text-center text-sm text-red-400 mb-4">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent outline-none text-white text-sm"
              >
                <option value="today" className="bg-slate-900">Today</option>
                <option value="week" className="bg-slate-900">This Week</option>
                <option value="month" className="bg-slate-900">This Month</option>
              </select>
            </div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value as "all" | ServiceType)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none backdrop-blur-sm text-white text-sm"
            >
              <option value="all" className="bg-slate-900">All Services</option>
              <option value="consultation" className="bg-slate-900">Consultation</option>
              <option value="documentation" className="bg-slate-900">Documentation</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-slate-400 mb-2">Total Patients</p>
            <p className="text-2xl mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{totalPatients}</p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>{todayTickets.length} today</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-slate-400 mb-2">Avg Wait Time</p>
            <p className="text-2xl mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{avgWait}m</p>
            <div className="flex items-center gap-2 text-blue-400 text-xs">
              <TrendingDown className="w-4 h-4" />
              <span>Live estimate</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-slate-400 mb-2">Peak Hours</p>
            <p className="text-2xl mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Today</p>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Activity className="w-4 h-4" />
              <span>{todayTickets.length} visits</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-slate-400 mb-2">Completion Rate</p>
            <p className="text-2xl mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{completionRate}%</p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>{completedTickets.length} completed</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <h3 className="mb-4 text-base">Daily Patient Volume</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 31, 54, 0.95)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "1rem",
                    color: "#f8fafc",
                  }}
                />
                <Bar dataKey="patients" fill="url(#colorPatients)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <h3 className="mb-4 text-base">Average Wait Time Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 31, 54, 0.95)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "1rem",
                    color: "#f8fafc",
                  }}
                />
                <Line type="monotone" dataKey="avgWait" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <h3 className="mb-4 text-base">Service Distribution</h3>
            <div className="space-y-2">
              {serviceData.map((item) => (
                <div key={item.service}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">{item.service}</span>
                    <span className="text-xs text-slate-400">{item.count}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <h3 className="mb-4 text-base">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2.5 text-xs text-slate-400 uppercase tracking-wider">Queue #</th>
                    <th className="text-left py-2.5 text-xs text-slate-400 uppercase tracking-wider">Service</th>
                    <th className="text-left py-2.5 text-xs text-slate-400 uppercase tracking-wider">Time</th>
                    <th className="text-left py-2.5 text-xs text-slate-400 uppercase tracking-wider">Wait</th>
                    <th className="text-left py-2.5 text-xs text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-2.5 text-sm">{tx.queueNumber}</td>
                      <td className="py-2.5 text-sm">{tx.serviceName}</td>
                      <td className="py-2.5 text-sm text-slate-400">{formatTime(tx.updatedAt)}</td>
                      <td className="py-2.5 text-sm text-slate-400">{getWaitTime(tx)}</td>
                      <td className="py-2.5">
                        <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
