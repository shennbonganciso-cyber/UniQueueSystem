import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Clock, Users, Bell, CheckCircle, XCircle, LogOut, Stethoscope, FileText, Plus, TrendingUp, AlertCircle, CheckCheck } from "lucide-react";
import { Logo } from "./Logo";
import { Footer } from "./Footer";

interface QueueItem {
  id: string;
  title: string;
  queueNumber: string;
  currentServing: string;
  estimatedWait: number;
  status: "waiting" | "next" | "serving" | "skipped" | "completed";
  icon: typeof Stethoscope;
  color: string;
  borderColor: string;
  isRejoined?: boolean;
  skippedTime?: number;
  originalQueueNumber?: string;
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const [activeQueues, setActiveQueues] = useState<QueueItem[]>([]);
  const [cancellingQueueId, setCancellingQueueId] = useState<string | null>(null);
  const [rejoiningQueueId, setRejoiningQueueId] = useState<string | null>(null);
  const [cancelledQueueName, setCancelledQueueName] = useState<string | null>(null);
  const [completedQueueName, setCompletedQueueName] = useState<string | null>(null);
  const [skippedQueueName, setSkippedQueueName] = useState<string | null>(null);
  const [rejoinedQueueName, setRejoinedQueueName] = useState<string | null>(null);
  const [liveQueueStatus, setLiveQueueStatus] = useState({
    consultation: { currentServing: "M-038", nextQueue: "M-045", estimatedWait: 21, waitingCount: 7 },
    documentation: { currentServing: "D-095", nextQueue: "D-102", estimatedWait: 14, waitingCount: 7 },
  });

  useEffect(() => {
    const storedQueues = sessionStorage.getItem("activeQueues");
    if (storedQueues) {
      const queues = JSON.parse(storedQueues);
      const formattedQueues: QueueItem[] = queues.map((q: any) => ({
        ...q,
        status: "waiting" as const,
        icon: q.id === "consultation" ? Stethoscope : FileText,
        borderColor: q.id === "consultation" ? "border-primary" : "border-accent",
      }));
      setActiveQueues(formattedQueues);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveQueueStatus((prev) => {
        const consultationCurrent = parseInt(prev.consultation.currentServing.split("-")[1]);
        const documentationCurrent = parseInt(prev.documentation.currentServing.split("-")[1]);

        return {
          consultation: {
            currentServing: `M-${String(consultationCurrent + 1).padStart(3, "0")}`,
            nextQueue: `M-${String(consultationCurrent + 8).padStart(3, "0")}`,
            estimatedWait: Math.max(15, prev.consultation.estimatedWait - 1),
            waitingCount: Math.max(5, prev.consultation.waitingCount + Math.floor(Math.random() * 3) - 1),
          },
          documentation: {
            currentServing: `D-${String(documentationCurrent + 1).padStart(3, "0")}`,
            nextQueue: `D-${String(documentationCurrent + 8).padStart(3, "0")}`,
            estimatedWait: Math.max(10, prev.documentation.estimatedWait - 1),
            waitingCount: Math.max(3, prev.documentation.waitingCount + Math.floor(Math.random() * 3) - 1),
          },
        };
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeQueues.length === 0) return;

    const interval = setInterval(() => {
      setActiveQueues((prevQueues) => {
        const updatedQueues = prevQueues.map((queue) => {
          const currentNum = parseInt(queue.currentServing.split("-")[1]);
          const queueNum = parseInt(queue.queueNumber.split("-")[1]);
          const nextServing = currentNum + 1;
          const prefix = queue.queueNumber.split("-")[0];

          let newStatus = queue.status;
          const oldStatus = queue.status;
          if (nextServing === queueNum - 1) newStatus = "next";
          if (nextServing === queueNum) newStatus = "serving";

          // Detect when status changes to completed (simulated here)
          // In real implementation, this would come from backend/staff action
          if (oldStatus === "serving" && Math.random() > 0.95) {
            newStatus = "completed";
            // Show toast notification
            setCompletedQueueName(queue.title);
            setTimeout(() => {
              setCompletedQueueName(null);
            }, 8000);
          }

          // Detect when status changes to skipped (simulated here)
          // In real implementation, this would come from backend/staff action
          if (oldStatus !== "skipped" && newStatus !== "skipped" && Math.random() > 0.98) {
            newStatus = "skipped";
            // Record skip time for grace period
            queue.skippedTime = Date.now();
            // Show toast notification
            setSkippedQueueName(queue.title);
            setTimeout(() => {
              setSkippedQueueName(null);
            }, 8000);
          }

          return {
            ...queue,
            currentServing: `${prefix}-${String(nextServing).padStart(3, "0")}`,
            estimatedWait: Math.max(0, queue.estimatedWait - 1),
            status: newStatus,
          };
        });

        // Filter out completed queues
        const filteredQueues = updatedQueues.filter((queue) => queue.status !== "completed");

        // Update sessionStorage
        if (filteredQueues.length > 0) {
          sessionStorage.setItem("activeQueues", JSON.stringify(filteredQueues));
        } else {
          sessionStorage.removeItem("activeQueues");
        }

        return filteredQueues;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeQueues.length]);

  const handleGetQueue = () => {
    navigate("/services");
  };

  const handleJoinQueue = (serviceType: "consultation" | "documentation") => {
    const serviceIds = serviceType === "consultation" ? ["consultation"] : ["documentation"];
    sessionStorage.setItem("selectedServices", JSON.stringify(serviceIds));
    navigate("/queue-confirmation");
  };

  const handleCancelQueue = (queueId: string, queueTitle: string) => {
    setCancellingQueueId(queueId);
  };

  const confirmCancelQueue = () => {
    if (!cancellingQueueId) return;

    const queueToCancel = activeQueues.find((q) => q.id === cancellingQueueId);
    if (queueToCancel) {
      setCancelledQueueName(queueToCancel.title);
      setActiveQueues((prev) => prev.filter((q) => q.id !== cancellingQueueId));
      const remaining = activeQueues.filter((q) => q.id !== cancellingQueueId);
      if (remaining.length > 0) {
        sessionStorage.setItem("activeQueues", JSON.stringify(remaining));
      } else {
        sessionStorage.removeItem("activeQueues");
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setCancelledQueueName(null);
      }, 5000);
    }

    setCancellingQueueId(null);
  };

  const cancelCancelQueue = () => {
    setCancellingQueueId(null);
  };

  const handleRejoinQueue = (queueId: string) => {
    setRejoiningQueueId(queueId);
  };

  const confirmRejoinQueue = () => {
    if (!rejoiningQueueId) return;

    const queueToRejoin = activeQueues.find((q) => q.id === rejoiningQueueId);
    if (queueToRejoin) {
      const prefix = queueToRejoin.queueNumber.split("-")[0];
      const currentServing = parseInt(queueToRejoin.currentServing.split("-")[1]);
      const skippedTime = queueToRejoin.skippedTime || 0;
      const gracePeriod = 120000; // 2 minutes in milliseconds
      const timeElapsed = Date.now() - skippedTime;
      const isWithinGracePeriod = timeElapsed < gracePeriod;

      // Check if within grace period to reclaim original slot
      if (isWithinGracePeriod && skippedTime > 0) {
        // Reclaim original queue number within grace period
        setActiveQueues((prev) =>
          prev.map((queue) => {
            if (queue.id === rejoiningQueueId) {
              return {
                ...queue,
                status: "waiting" as const,
                estimatedWait: Math.max(5, (parseInt(queue.queueNumber.split("-")[1]) - currentServing) * 3),
                isRejoined: true,
              };
            }
            return queue;
          })
        );

        // Update sessionStorage
        const updatedQueues = activeQueues.map((queue) => {
          if (queue.id === rejoiningQueueId) {
            return {
              ...queue,
              status: "waiting" as const,
              estimatedWait: Math.max(5, (parseInt(queue.queueNumber.split("-")[1]) - currentServing) * 3),
              isRejoined: true,
            };
          }
          return queue;
        });
        sessionStorage.setItem("activeQueues", JSON.stringify(updatedQueues));

        setRejoinedQueueName(queueToRejoin.title + " (Original Slot)");
      } else {
        // Generate NEW queue number and place at end of queue
        // Find the highest queue number in the system for this service type
        const allQueuesOfType = activeQueues.filter(q => q.queueNumber.startsWith(prefix));
        const highestNumber = Math.max(
          currentServing + 10, // At least 10 ahead of current
          ...allQueuesOfType.map(q => parseInt(q.queueNumber.split("-")[1])),
          parseInt(liveQueueStatus[queueToRejoin.id as keyof typeof liveQueueStatus].nextQueue.split("-")[1]) + 5
        );

        const newQueueNumber = `${prefix}-${String(highestNumber + 1).padStart(3, "0")}`;

        setActiveQueues((prev) =>
          prev.map((queue) => {
            if (queue.id === rejoiningQueueId) {
              return {
                ...queue,
                originalQueueNumber: queue.queueNumber, // Archive old number
                queueNumber: newQueueNumber, // Assign new number
                status: "waiting" as const,
                estimatedWait: (highestNumber + 1 - currentServing) * 3,
                isRejoined: true,
              };
            }
            return queue;
          })
        );

        // Update sessionStorage
        const updatedQueues = activeQueues.map((queue) => {
          if (queue.id === rejoiningQueueId) {
            return {
              ...queue,
              originalQueueNumber: queue.queueNumber,
              queueNumber: newQueueNumber,
              status: "waiting" as const,
              estimatedWait: (highestNumber + 1 - currentServing) * 3,
              isRejoined: true,
            };
          }
          return queue;
        });
        sessionStorage.setItem("activeQueues", JSON.stringify(updatedQueues));

        setRejoinedQueueName(queueToRejoin.title);
      }

      setTimeout(() => {
        setRejoinedQueueName(null);
      }, 5000);
    }

    setRejoiningQueueId(null);
  };

  const cancelRejoinQueue = () => {
    setRejoiningQueueId(null);
  };

  const getStatusConfig = (status: "waiting" | "next" | "serving" | "skipped" | "completed") => {
    switch (status) {
      case "serving":
        return { bg: "bg-emerald-500/20", text: "Currently Being Served", icon: CheckCircle, textColor: "text-emerald-400", description: "You're at the service area" };
      case "next":
        return { bg: "bg-blue-500/20", text: "About to be Served", icon: Bell, textColor: "text-blue-400", description: "You're next in line" };
      case "completed":
        return { bg: "bg-green-500/20", text: "Completed", icon: CheckCheck, textColor: "text-green-400", description: "Service finished" };
      case "skipped":
        return { bg: "bg-orange-500/20", text: "Temporarily Bypassed", icon: AlertCircle, textColor: "text-orange-400", description: "Can rejoin anytime" };
      default:
        return { bg: "bg-amber-500/20", text: "In Line", icon: Clock, textColor: "text-amber-400", description: "Waiting for your turn" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col">
      <header className="bg-card/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="border-l border-white/10 pl-3 ml-1">
              <h1 className="text-base">UniQueue</h1>
              <p className="text-xs text-slate-400">Student Portal</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Rejoined Queue notification toast */}
        {rejoinedQueueName && (
          <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-right">
            <div className="bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl rounded-2xl p-4 border border-blue-500/30 shadow-2xl shadow-blue-500/20 min-w-[300px]">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-50 animate-pulse" />
                    <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-blue-400 mb-0.5 text-sm">✅ Rejoined Successfully</p>
                  <p className="text-xs text-slate-300">
                    {rejoinedQueueName.includes("(Original Slot)")
                      ? `Your original slot has been reclaimed for ${rejoinedQueueName.replace(" (Original Slot)", "")}.`
                      : `You have been re-added to the queue for ${rejoinedQueueName} with a new number.`}
                  </p>
                </div>
                <button
                  onClick={() => setRejoinedQueueName(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Completed notification toast */}
        {completedQueueName && (
          <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-right">
            <div className="bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl rounded-2xl p-4 border border-green-500/30 shadow-2xl shadow-green-500/20 min-w-[300px]">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-sm opacity-50 animate-pulse" />
                    <div className="relative w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCheck className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-green-400 mb-0.5 text-sm">🎉 Service Completed!</p>
                  <p className="text-xs text-slate-300">
                    Your {completedQueueName} has been completed successfully.
                  </p>
                </div>
                <button
                  onClick={() => setCompletedQueueName(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Skipped notification toast */}
        {skippedQueueName && (
          <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-right">
            <div className="bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl rounded-2xl p-4 border border-orange-500/30 shadow-2xl shadow-orange-500/20 min-w-[300px]">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500 rounded-full blur-sm opacity-50 animate-pulse" />
                    <div className="relative w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-orange-400 mb-0.5 text-sm">⚠️ Queue Skipped</p>
                  <p className="text-xs text-slate-300">
                    Your {skippedQueueName} was skipped by staff. You can rejoin the queue.
                  </p>
                </div>
                <button
                  onClick={() => setSkippedQueueName(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation notification toast */}
        {cancelledQueueName && (
          <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-right">
            <div className="bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl rounded-2xl p-4 border border-red-500/30 shadow-2xl shadow-red-500/20 min-w-[280px]">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-red-400 mb-0.5 text-sm">Queue Cancelled</p>
                  <p className="text-xs text-slate-300">
                    Your {cancelledQueueName} queue has been removed.
                  </p>
                </div>
                <button
                  onClick={() => setCancelledQueueName(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Queue Confirmation Dialog */}
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
                  onClick={cancelCancelQueue}
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

        {/* Rejoin Queue Confirmation Dialog */}
        {rejoiningQueueId && (() => {
          const queueToRejoin = activeQueues.find((q) => q.id === rejoiningQueueId);
          const skippedTime = queueToRejoin?.skippedTime || 0;
          const gracePeriod = 120000; // 2 minutes
          const timeElapsed = Date.now() - skippedTime;
          const isWithinGracePeriod = timeElapsed < gracePeriod && skippedTime > 0;
          const timeRemaining = Math.ceil((gracePeriod - timeElapsed) / 1000);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl max-w-sm w-full">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-base mb-2">Rejoin Queue?</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {isWithinGracePeriod
                      ? "You can reclaim your original queue position."
                      : "You will be assigned a new queue number at the end of the queue."}
                  </p>
                  <div className={`border rounded-xl p-4 ${isWithinGracePeriod ? 'bg-blue-500/10 border-blue-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                    <p className={`text-xs ${isWithinGracePeriod ? 'text-blue-400' : 'text-orange-400'}`}>
                      {isWithinGracePeriod ? (
                        <>⏱️ Grace period: {timeRemaining}s remaining to reclaim {queueToRejoin?.queueNumber}</>
                      ) : (
                        <>Your original number ({queueToRejoin?.queueNumber}) will be archived and a new number assigned.</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={cancelRejoinQueue}
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
          );
        })()}

        {activeQueues.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-emerald-400">Queue Position Updates in Real-Time</span>
              </div>
              <h2 className="text-2xl mb-2 bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">Welcome to UniQueue</h2>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto">View live queue status and register for clinic services</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-indigo-500/50 transition-all duration-500 hover:scale-[1.01]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg blur-md opacity-50" />
                      <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center shadow-xl">
                        <Stethoscope className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base mb-0.5">Medical Consultation</h3>
                      <p className="text-xs text-slate-400">General checkup and diagnosis</p>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-0.5">
                            Now Serving
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                          </p>
                          <p className="text-2xl bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">{liveQueueStatus.consultation.currentServing}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <p className="text-xs text-slate-400 uppercase tracking-wider">People Waiting</p>
                    </div>
                    <p className="text-2xl mb-0.5">{liveQueueStatus.consultation.waitingCount}</p>
                    <p className="text-xs text-slate-500">Currently in queue</p>
                  </div>

                  <button
                    onClick={() => handleJoinQueue("consultation")}
                    className="relative w-full group overflow-hidden bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Plus className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Join This Queue</span>
                  </button>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:scale-[1.01]">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg blur-md opacity-50" />
                      <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-xl">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base mb-0.5">Administrative Request</h3>
                      <p className="text-xs text-slate-400">Certificates and documents</p>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-0.5">
                            Now Serving
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                          </p>
                          <p className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{liveQueueStatus.documentation.currentServing}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <p className="text-xs text-slate-400 uppercase tracking-wider">People Waiting</p>
                    </div>
                    <p className="text-2xl mb-0.5">{liveQueueStatus.documentation.waitingCount}</p>
                    <p className="text-xs text-slate-500">Currently in queue</p>
                  </div>

                  <button
                    onClick={() => handleJoinQueue("documentation")}
                    className="relative w-full group overflow-hidden bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2.5 rounded-xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Plus className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Join This Queue</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-4 border border-indigo-500/20 backdrop-blur-sm text-center">
              <p className="text-sm text-slate-300 mb-4">
                <span className="text-base mr-1">💡</span>
                <strong className="text-white">Tip:</strong> You can join both queues simultaneously. Click "Join This Queue" or use the button below to select multiple services.
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
                    <p className="text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{activeQueues.length}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Active {activeQueues.length === 1 ? "Service" : "Services"}</p>
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
                const Icon = queue.icon;
                const statusConfig = getStatusConfig(queue.status);
                const StatusIcon = statusConfig.icon;
                const queueNum = parseInt(queue.queueNumber.split("-")[1]);
                const servingNum = parseInt(queue.currentServing.split("-")[1]);
                const peopleAhead = Math.max(0, queueNum - servingNum);
                const isConsultation = queue.id === "consultation";
                const gradientFrom = isConsultation ? "from-indigo-500" : "from-purple-500";
                const gradientTo = isConsultation ? "to-blue-600" : "to-pink-600";

                return (
                  <div
                    key={queue.id}
                    className="group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-indigo-500/50 transition-all duration-500 hover:scale-[1.01]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg blur-md opacity-50`} />
                            <div className={`relative w-10 h-10 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg flex items-center justify-center shadow-xl`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-base">{queue.title}</h3>
                              {queue.isRejoined && (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 backdrop-blur-sm">
                                  Rejoined
                                </span>
                              )}
                            </div>
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${statusConfig.bg} ${statusConfig.textColor} backdrop-blur-sm border border-white/10`}>
                              <StatusIcon className="w-3 h-3" />
                              <span>{statusConfig.text}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-4 mb-4 text-center border-2 border-dashed border-indigo-500/30">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Your Queue Number</p>
                        <p className={`text-5xl bg-gradient-to-r ${isConsultation ? "from-indigo-400 to-blue-400" : "from-purple-400 to-pink-400"} bg-clip-text text-transparent`}>
                          {queue.queueNumber}
                        </p>
                        {queue.originalQueueNumber && (
                          <p className="text-xs text-slate-500 mt-2">
                            Previously: {queue.originalQueueNumber}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg flex items-center justify-center shadow-lg`}>
                                <TrendingUp className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Now Serving</p>
                                <p className={`text-base bg-gradient-to-r ${isConsultation ? "from-indigo-400 to-blue-400" : "from-purple-400 to-pink-400"} bg-clip-text text-transparent`}>{queue.currentServing}</p>
                              </div>
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
                              <p className="text-sm mb-2 text-emerald-400">
                                🎯 Currently Being Served
                              </p>
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
                              <p className="text-sm mb-2 text-blue-400">
                                ⚡ About to be Served
                              </p>
                              <p className="text-xs text-slate-300">
                                You're next in line! Please stay nearby and be ready to proceed.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {queue.status === "skipped" && (() => {
                        const skippedTime = queue.skippedTime || 0;
                        const gracePeriod = 120000; // 2 minutes
                        const timeElapsed = Date.now() - skippedTime;
                        const isWithinGracePeriod = timeElapsed < gracePeriod && skippedTime > 0;
                        const timeRemaining = Math.ceil((gracePeriod - timeElapsed) / 1000);

                        return (
                          <div className="bg-orange-500/10 border-orange-500/30 border-2 rounded-xl p-4 mb-4 backdrop-blur-sm">
                            <div className="flex items-start gap-2 mb-4">
                              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm mb-2 text-orange-400">
                                  ⚠️ Temporarily Bypassed
                                </p>
                                <p className="text-xs text-slate-300 mb-2">
                                  Your turn was temporarily skipped by staff. You can rejoin the queue.
                                </p>
                                <div className={`border rounded-lg p-4 ${isWithinGracePeriod ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                                  <p className={`text-xs ${isWithinGracePeriod ? 'text-blue-300' : 'text-orange-300'}`}>
                                    {isWithinGracePeriod ? (
                                      <>⏱️ <strong>Grace Period Active:</strong> Reclaim your original number ({queue.queueNumber}) within {timeRemaining}s</>
                                    ) : (
                                      <>ℹ️ <strong>Note:</strong> You will receive a new queue number and be placed at the end of the queue</>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRejoinQueue(queue.id)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Rejoin Queue
                            </button>
                          </div>
                        );
                      })()}

                      {queue.status !== "skipped" && (
                        <button
                          onClick={() => handleCancelQueue(queue.id, queue.title)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 hover:border-red-500/50 transition-all backdrop-blur-sm text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel This Queue
                        </button>
                      )}

                      {queue.status === "skipped" && (
                        <button
                          onClick={() => handleCancelQueue(queue.id, queue.title)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 border-2 border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 hover:border-red-500/50 transition-all backdrop-blur-sm text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel This Queue
                        </button>
                      )}
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
