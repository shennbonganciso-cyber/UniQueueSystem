import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  Bell,
  CheckCheck,
  CheckCircle,
  Clock,
  FileText,
  LogOut,
  Plus,
  Stethoscope,
  TrendingUp,
  Users,
  XCircle,
  Settings,
} from "lucide-react";
import { Logo } from "./Logo";
import { Footer } from "./Footer";
import {
  deleteQueueTicket,
  getQueueTickets,
  updateQueueTicket,
  type QueueTicket,
  type ServiceType,
} from "../lib/queueApi";
import {
  getNowServing,
  getPeopleAhead,
  SERVICE_DETAILS,
} from "../lib/queueUtils";
import { subscribeToQueueUpdates } from "../lib/queueSocket";

type UiStatus = "waiting" | "next" | "serving" | "skipped" | "completed";

interface QueueItem {
  id: string;
  title: string;
  queueNumber: string;
  currentServing: string;
  status: UiStatus;
  serviceType: ServiceType;
  ticket: QueueTicket;
}

function getStudentId() {
  return sessionStorage.getItem("studentId") || "guest-student";
}

function buildQueueItem(ticket: QueueTicket, todayTickets: QueueTicket[]): QueueItem {
  const peopleAhead = getPeopleAhead(todayTickets, ticket);
  const status: UiStatus =
    ticket.status === "waiting" && peopleAhead === 0
      ? "next"
      : ticket.status === "cancelled"
        ? "completed"
        : ticket.status;

  return {
    id: ticket._id,
    title: SERVICE_DETAILS[ticket.serviceType].title,
    queueNumber: ticket.queueNumber,
    currentServing: getNowServing(todayTickets, ticket.serviceType),
    status,
    serviceType: ticket.serviceType,
    ticket,
  };
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const [todayTickets, setTodayTickets] = useState<QueueTicket[]>([]);
  const [activeQueues, setActiveQueues] = useState<QueueItem[]>([]);
  const [cancellingQueueId, setCancellingQueueId] = useState<string | null>(null);
  const [rejoiningQueueId, setRejoiningQueueId] = useState<string | null>(null);
  const [cancelledQueueName, setCancelledQueueName] = useState<string | null>(null);
  const [completedQueueName, setCompletedQueueName] = useState<string | null>(null);
  const [skippedQueueName, setSkippedQueueName] = useState<string | null>(null);
  const [rejoinedQueueName, setRejoinedQueueName] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadQueues = async () => {
    try {
      setError("");
      const tickets = await getQueueTickets({ date: "today" });
      const studentTickets = tickets.filter(
        (ticket) =>
          ticket.studentId === getStudentId() &&
          ticket.status !== "completed" &&
          ticket.status !== "cancelled",
      );

      setTodayTickets(tickets);
      setActiveQueues(studentTickets.map((ticket) => buildQueueItem(ticket, tickets)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load queue data");
    }
  };

  useEffect(() => {
    loadQueues();
    const unsubscribe = subscribeToQueueUpdates(loadQueues);
    const fallbackInterval = window.setInterval(loadQueues, 30000);

    return () => {
      unsubscribe();
      window.clearInterval(fallbackInterval);
    };
  }, []);

  const liveQueueStatus = {
    consultation: {
      currentServing: getNowServing(todayTickets, "consultation"),
      waitingCount: todayTickets.filter(
        (ticket) => ticket.serviceType === "consultation" && ticket.status === "waiting",
      ).length,
    },
    documentation: {
      currentServing: getNowServing(todayTickets, "documentation"),
      waitingCount: todayTickets.filter(
        (ticket) => ticket.serviceType === "documentation" && ticket.status === "waiting",
      ).length,
    },
  };

  const handleGetQueue = () => navigate("/services");
  const handleJoinQueue = (serviceType: ServiceType) => {
    navigate(`/queue-confirmation?services=${serviceType}`);
  };

  const confirmCancelQueue = async () => {
    if (!cancellingQueueId) return;

    const queueToCancel = activeQueues.find((queue) => queue.id === cancellingQueueId);
    if (queueToCancel) {
      try {
        await deleteQueueTicket(cancellingQueueId);
        setCancelledQueueName(queueToCancel.title);
        window.setTimeout(() => setCancelledQueueName(null), 5000);
        await loadQueues();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to cancel queue");
      }
    }

    setCancellingQueueId(null);
  };

  const confirmRejoinQueue = async () => {
    if (!rejoiningQueueId) return;

    const queueToRejoin = activeQueues.find((queue) => queue.id === rejoiningQueueId);
    if (queueToRejoin) {
      try {
        await updateQueueTicket(rejoiningQueueId, { status: "waiting" });
        setRejoinedQueueName(queueToRejoin.title);
        window.setTimeout(() => setRejoinedQueueName(null), 5000);
        await loadQueues();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to rejoin queue");
      }
    }

    setRejoiningQueueId(null);
  };

  const getStatusConfig = (status: UiStatus) => {
    switch (status) {
      case "serving":
        return {
          bg: "bg-emerald-500/20",
          text: "Currently Being Served",
          icon: CheckCircle,
          textColor: "text-emerald-400",
        };
      case "next":
        return {
          bg: "bg-blue-500/20",
          text: "About to be Served",
          icon: Bell,
          textColor: "text-blue-400",
        };
      case "completed":
        return {
          bg: "bg-green-500/20",
          text: "Completed",
          icon: CheckCheck,
          textColor: "text-green-400",
        };
      case "skipped":
        return {
          bg: "bg-orange-500/20",
          text: "Temporarily Bypassed",
          icon: AlertCircle,
          textColor: "text-orange-400",
        };
      default:
        return {
          bg: "bg-amber-500/20",
          text: "In Line",
          icon: Clock,
          textColor: "text-amber-400",
        };
    }
  };

  const renderToast = (
    value: string | null,
    clear: () => void,
    color: "blue" | "green" | "orange" | "red",
    title: string,
    message: string,
  ) => {
    if (!value) return null;

    const classes = {
      blue: "border-blue-500/30 shadow-blue-500/20 text-blue-400 from-blue-500 to-indigo-600",
      green: "border-green-500/30 shadow-green-500/20 text-green-400 from-green-500 to-emerald-600",
      orange: "border-orange-500/30 shadow-orange-500/20 text-orange-400 from-orange-500 to-amber-600",
      red: "border-red-500/30 shadow-red-500/20 text-red-400 from-red-500 to-red-600",
    };

    return (
      <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-right">
        <div className={`bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl rounded-2xl p-4 border shadow-2xl min-w-[280px] ${classes[color]}`}>
          <div className="flex items-start gap-2">
            <div className={`w-8 h-8 bg-gradient-to-br ${classes[color]} rounded-full flex items-center justify-center shadow-lg`}>
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="mb-0.5 text-sm">{title}</p>
              <p className="text-xs text-slate-300">{message}</p>
            </div>
            <button onClick={clear} className="text-slate-400 hover:text-white transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col">
      <header className="bg-card/50 backdrop-blur-xl border-b border-white/10">
  <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
    
    {/* LEFT SIDE */}
    <div className="flex items-center gap-3">
      <Logo size="md" />
      <div className="border-l border-white/10 pl-3 ml-1">
        <h1 className="text-base">UniQueue</h1>
        <p className="text-xs text-slate-400">Student Portal</p>
      </div>
    </div>

    {/* RIGHT SIDE BUTTONS */}
    <div className="flex items-center gap-2">

      {/* SETTINGS BUTTON */}
      <button
        onClick={() => navigate("/student/settings")}
        className="px-4 py-2.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
      >
        Settings
      </button>

      {/* LOGOUT BUTTON */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline text-sm">Logout</span>
      </button>

    </div>
  </div>
</header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {error && <p className="text-center text-sm text-red-400 mb-4">{error}</p>}

        {renderToast(rejoinedQueueName, () => setRejoinedQueueName(null), "blue", "Rejoined Successfully", `Your queue has been re-added for ${rejoinedQueueName}.`)}
        {renderToast(completedQueueName, () => setCompletedQueueName(null), "green", "Service Completed", `Your ${completedQueueName} has been completed successfully.`)}
        {renderToast(skippedQueueName, () => setSkippedQueueName(null), "orange", "Queue Skipped", `Your ${skippedQueueName} was skipped by staff. You can rejoin the queue.`)}
        {renderToast(cancelledQueueName, () => setCancelledQueueName(null), "red", "Queue Cancelled", `Your ${cancelledQueueName} queue has been removed.`)}

        {cancellingQueueId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl max-w-sm w-full">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-base mb-2">Cancel Queue?</h3>
                <p className="text-sm text-slate-400">
                  Are you sure you want to cancel this queue? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCancellingQueueId(null)}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all text-sm"
                >
                  No, Keep It
                </button>
                <button
                  onClick={confirmCancelQueue}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-2xl hover:shadow-red-500/25 transition-all text-sm"
                >
                  Yes, Cancel Queue
                </button>
              </div>
            </div>
          </div>
        )}

        {rejoiningQueueId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl max-w-sm w-full">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-base mb-2">Rejoin Queue?</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Your skipped queue will be marked as waiting again.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRejoiningQueueId(null)}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRejoinQueue}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all text-sm"
                >
                  Yes, Rejoin
                </button>
              </div>
            </div>
          </div>
        )}

        {activeQueues.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-emerald-400">Queue Position Updates in Real-Time</span>
              </div>
              <h2 className="text-2xl mb-2 bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
                Welcome to UniQueue
              </h2>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                View live queue status and register for clinic services
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(["consultation", "documentation"] as ServiceType[]).map((serviceType) => {
                const isConsultation = serviceType === "consultation";
                const Icon = isConsultation ? Stethoscope : FileText;
                const gradient = isConsultation
                  ? "from-indigo-500 to-blue-600"
                  : "from-purple-500 to-pink-600";
                const liveStatus = liveQueueStatus[serviceType];

                return (
                  <div
                    key={serviceType}
                    className={`group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl border border-white/10 ${isConsultation ? "hover:border-indigo-500/50" : "hover:border-purple-500/50"} transition-all duration-500 hover:scale-[1.01]`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="relative">
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-lg blur-md opacity-50`} />
                          <div className={`relative w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-xl`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-base mb-0.5">{SERVICE_DETAILS[serviceType].title}</h3>
                          <p className="text-xs text-slate-400">
                            {isConsultation ? "General checkup and diagnosis" : "Certificates and documents"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-lg`}>
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-0.5">
                              Now Serving
                              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                            </p>
                            <p className={`text-2xl bg-gradient-to-r ${isConsultation ? "from-indigo-400 to-blue-400" : "from-purple-400 to-pink-400"} bg-clip-text text-transparent`}>
                              {liveStatus.currentServing}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-amber-400" />
                          <p className="text-xs text-slate-400 uppercase tracking-wider">People Waiting</p>
                        </div>
                        <p className="text-2xl mb-0.5">{liveStatus.waitingCount}</p>
                        <p className="text-xs text-slate-500">Currently in queue</p>
                      </div>

                      <button
                        onClick={() => handleJoinQueue(serviceType)}
                        className={`relative w-full group overflow-hidden bg-gradient-to-r ${gradient} text-white px-4 py-2.5 rounded-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 text-sm`}
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <Plus className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">Join This Queue</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-4 border border-indigo-500/20 backdrop-blur-sm text-center">
              <p className="text-sm text-slate-300 mb-4">
                <strong className="text-white">Tip:</strong> You can join both queues simultaneously.
                Click "Join This Queue" or use the button below to select multiple services.
              </p>
              <button
                onClick={handleGetQueue}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all inline-flex items-center gap-2 backdrop-blur-sm text-sm"
              >
                <Plus className="w-4 h-4" />
                Select Multiple Services
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-base">Active Queues</h2>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span className="text-xs text-emerald-400">Live Updates</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Queue position updates in real-time</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      {activeQueues.length}
                    </p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">
                      Active {activeQueues.length === 1 ? "Service" : "Services"}
                    </p>
                  </div>
                  <button
                    onClick={handleGetQueue}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all flex items-center gap-2 backdrop-blur-sm text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Service</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeQueues.map((queue) => {
                const isConsultation = queue.serviceType === "consultation";
                const Icon = isConsultation ? Stethoscope : FileText;
                const statusConfig = getStatusConfig(queue.status);
                const StatusIcon = statusConfig.icon;
                const gradientFrom = isConsultation ? "from-indigo-500" : "from-purple-500";
                const gradientTo = isConsultation ? "to-blue-600" : "to-pink-600";
                const peopleAhead = getPeopleAhead(todayTickets, queue.ticket);

                return (
                  <div
                    key={queue.id}
                    className="group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-indigo-500/50 transition-all duration-500 hover:scale-[1.01]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="relative">
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg blur-md opacity-50`} />
                          <div className={`relative w-10 h-10 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg flex items-center justify-center shadow-xl`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-base mb-0.5">{queue.title}</h3>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${statusConfig.bg} ${statusConfig.textColor} backdrop-blur-sm border border-white/10`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusConfig.text}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-4 mb-4 text-center border-2 border-dashed border-indigo-500/30">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Your Queue Number</p>
                        <p className={`text-5xl bg-gradient-to-r ${isConsultation ? "from-indigo-400 to-blue-400" : "from-purple-400 to-pink-400"} bg-clip-text text-transparent`}>
                          {queue.queueNumber}
                        </p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg flex items-center justify-center shadow-lg`}>
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Now Serving</p>
                              <p className={`text-base bg-gradient-to-r ${isConsultation ? "from-indigo-400 to-blue-400" : "from-purple-400 to-pink-400"} bg-clip-text text-transparent`}>
                                {queue.currentServing}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Queue Position</p>
                          </div>
                          <p className="text-2xl mb-0.5">{peopleAhead}</p>
                          <p className="text-xs text-slate-500">People ahead of you</p>
                        </div>
                      </div>

                      {queue.status === "serving" && (
                        <div className="bg-emerald-500/10 border-emerald-500/30 border-2 rounded-xl p-4 mb-4 backdrop-blur-sm">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <p className="text-sm mb-2 text-emerald-400">Currently Being Served</p>
                              <p className="text-xs text-slate-300">
                                Please proceed to the service area immediately. You're being served now.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {queue.status === "next" && (
                        <div className="bg-blue-500/10 border-blue-500/30 border-2 rounded-xl p-4 mb-4 backdrop-blur-sm">
                          <div className="flex items-start gap-2">
                            <Bell className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <p className="text-sm mb-2 text-blue-400">About to be Served</p>
                              <p className="text-xs text-slate-300">
                                You're next in line! Please stay nearby and be ready to proceed.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {queue.status === "skipped" && (
                        <div className="bg-orange-500/10 border-orange-500/30 border-2 rounded-xl p-4 mb-4 backdrop-blur-sm">
                          <div className="flex items-start gap-2 mb-4">
                            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm mb-2 text-orange-400">Temporarily Bypassed</p>
                              <p className="text-xs text-slate-300 mb-2">
                                Your turn was temporarily skipped by staff. You can rejoin the queue.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setRejoiningQueueId(queue.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Rejoin Queue
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setCancellingQueueId(queue.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 hover:border-red-500/50 transition-all backdrop-blur-sm text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel This Queue
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
