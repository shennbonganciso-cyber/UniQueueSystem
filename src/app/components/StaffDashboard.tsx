import { useState } from "react";
import { useNavigate } from "react-router";
import { LogOut, PlayCircle, SkipForward, CheckCircle, FileBarChart, Activity, AlertCircle, CheckCheck } from "lucide-react";
import { Logo } from "./Logo";
import { Footer } from "./Footer";

interface QueueItem {
  id: number;
  number: number;
  service: string;
  status: "waiting" | "next" | "serving" | "skipped" | "completed";
  waitTime: string;
}

export function StaffDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"consultation" | "documentation">("consultation");
  const [consultationQueue, setConsultationQueue] = useState<QueueItem[]>([
    { id: 1, number: 38, service: "Consultation", status: "serving", waitTime: "2m" },
    { id: 2, number: 39, service: "Consultation", status: "waiting", waitTime: "5m" },
    { id: 3, number: 40, service: "Consultation", status: "waiting", waitTime: "8m" },
    { id: 4, number: 42, service: "Consultation", status: "waiting", waitTime: "12m" },
    { id: 5, number: 43, service: "Consultation", status: "waiting", waitTime: "15m" },
  ]);

  const [documentationQueue, setDocumentationQueue] = useState<QueueItem[]>([
    { id: 6, number: 101, service: "Medical Certificate", status: "serving", waitTime: "1m" },
    { id: 7, number: 102, service: "Excuse Slip", status: "waiting", waitTime: "3m" },
    { id: 8, number: 103, service: "Medical Certificate", status: "waiting", waitTime: "6m" },
  ]);

  const currentQueue = activeTab === "consultation" ? consultationQueue : documentationQueue;
  const setCurrentQueue = activeTab === "consultation" ? setConsultationQueue : setDocumentationQueue;
  const servingItem = currentQueue.find((item) => item.status === "serving");

  const handleCallNext = () => {
    setCurrentQueue((prev) => {
      const newQueue = [...prev];
      const servingIndex = newQueue.findIndex((item) => item.status === "serving");
      if (servingIndex !== -1) {
        newQueue[servingIndex].status = "completed";
      }
      const nextIndex = newQueue.findIndex((item) => item.status === "waiting");
      if (nextIndex !== -1) {
        newQueue[nextIndex].status = "serving";
      }
      return newQueue.filter((item) => item.status !== "completed");
    });
  };

  const handleSkip = () => {
    setCurrentQueue((prev) => {
      const newQueue = [...prev];
      const servingIndex = newQueue.findIndex((item) => item.status === "serving");
      if (servingIndex !== -1) {
        newQueue[servingIndex].status = "skipped";
        const nextIndex = newQueue.findIndex((item, idx) => idx > servingIndex && item.status === "waiting");
        if (nextIndex !== -1) {
          newQueue[nextIndex].status = "serving";
        }
      }
      return newQueue;
    });
  };

  const handleComplete = () => {
    setCurrentQueue((prev) => prev.filter((item) => item.status !== "serving"));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "serving":
        return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30 backdrop-blur-sm">Serving</span>;
      case "next":
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 backdrop-blur-sm">Next</span>;
      case "waiting":
        return <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30 backdrop-blur-sm">Waiting</span>;
      case "skipped":
        return <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30 backdrop-blur-sm">Skipped</span>;
      case "completed":
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 backdrop-blur-sm">Completed</span>;
      default:
        return <span className="px-3 py-1 bg-white/10 text-slate-400 text-xs rounded-full border border-white/10 backdrop-blur-sm">Unknown</span>;
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
              <p className="text-xs text-slate-400">Staff Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/reports")}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
            >
              <FileBarChart className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Reports</span>
            </button>
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
        {/* Real-time indicator */}
        <div className="mb-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-emerald-400">Real-Time Queue Updates</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="border-b border-white/10">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("consultation")}
                    className={`flex-1 px-4 py-2.5 transition-all relative ${
                      activeTab === "consultation"
                        ? "text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {activeTab === "consultation" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-blue-600" />
                    )}
                    <span className="relative z-10 text-sm">Consultation ({consultationQueue.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("documentation")}
                    className={`flex-1 px-4 py-2.5 transition-all relative ${
                      activeTab === "documentation"
                        ? "text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {activeTab === "documentation" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-600" />
                    )}
                    <span className="relative z-10 text-sm">Documentation ({documentationQueue.length})</span>
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-2">
                  {currentQueue.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        item.status === "serving"
                          ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-center min-w-[2.5rem]">
                          <p className="text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{item.number}</p>
                        </div>
                        <div>
                          <p className="text-sm mb-0.5">{item.service}</p>
                          <p className="text-xs text-slate-400">Wait time: {item.waitTime}</p>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base">Now Serving</h3>
              </div>
              {servingItem ? (
                <div className="text-center mb-4">
                  <p className="text-5xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">{servingItem.number}</p>
                  <p className="text-xs text-slate-400">{servingItem.service}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400">No one being served</p>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={handleCallNext}
                  disabled={!currentQueue.some((item) => item.status === "waiting")}
                  className="relative w-full group overflow-hidden bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <PlayCircle className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Call Next</span>
                </button>
                <button
                  onClick={handleSkip}
                  disabled={!servingItem}
                  className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 text-sm"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!servingItem}
                  className="relative w-full group overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl hover:shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <CheckCircle className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Complete</span>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <h3 className="text-base mb-4">Statistics</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-xs text-slate-400">Total Served Today</span>
                  <span className="text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">37</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-xs text-slate-400">Avg Wait Time</span>
                  <span className="text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">5 min</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-xs text-slate-400">In Queue</span>
                  <span className="text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{currentQueue.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
