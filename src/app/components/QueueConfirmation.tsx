import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle, Clock, Users, Home, Stethoscope, FileText, Sparkles } from "lucide-react";
import { Logo } from "./Logo";
import { Footer } from "./Footer";
import { createQueueTicket, getQueueTickets, type QueueTicket, type ServiceType } from "../lib/queueApi";
import { getNowServing, getPeopleAhead, SERVICE_DETAILS } from "../lib/queueUtils";

interface QueueData {
  ticket: QueueTicket;
  id: ServiceType;
  title: string;
  queueNumber: string;
  currentServing: string;
  peopleAhead: number;
  estimatedWait: number;
  icon: typeof Stethoscope;
  gradient: string;
}

const serviceIcons = {
  consultation: Stethoscope,
  documentation: FileText,
};

const serviceGradients = {
  consultation: "from-indigo-500 to-blue-600",
  documentation: "from-purple-500 to-pink-600",
};

function getSelectedServices(value: string | null): ServiceType[] {
  return (value ?? "")
    .split(",")
    .filter((service): service is ServiceType => service === "consultation" || service === "documentation");
}

export function QueueConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [queues, setQueues] = useState<QueueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function createSelectedQueues() {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;

      try {
        setIsLoading(true);
        setError("");

        const selectedServices = getSelectedServices(searchParams.get("services"));
        if (selectedServices.length === 0) {
          navigate("/services");
          return;
        }

        const studentId = sessionStorage.getItem("studentId") || "guest-student";
        const studentName = sessionStorage.getItem("studentName") || studentId;
        const existingTickets = await getQueueTickets({ date: "today" });
        const createdTickets: QueueTicket[] = [];

        for (const serviceType of selectedServices) {
          const details = SERVICE_DETAILS[serviceType];

          const created = await createQueueTicket({
            studentName,
            studentId,
            serviceType,
            serviceName: details.serviceName,
          });

          createdTickets.push(created);
        }

        const todayTickets = [...existingTickets, ...createdTickets];
        const formattedQueues = createdTickets.map((ticket) => ({
          ticket,
          id: ticket.serviceType,
          title: SERVICE_DETAILS[ticket.serviceType].title,
          queueNumber: ticket.queueNumber,
          currentServing: getNowServing(todayTickets, ticket.serviceType),
          peopleAhead: getPeopleAhead(todayTickets, ticket),
          estimatedWait: getPeopleAhead(todayTickets, ticket) * 3,
          icon: serviceIcons[ticket.serviceType],
          gradient: serviceGradients[ticket.serviceType],
        }));

        if (isMounted) {
          setQueues(formattedQueues);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to create queue ticket");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    createSelectedQueues();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  const handleGoToDashboard = () => {
    navigate("/student");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col">
      <header className="bg-card/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="border-l border-white/10 pl-3 ml-1">
              <h1 className="text-base">UniQueue</h1>
              <p className="text-xs text-slate-400">Queue Confirmed</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4">
        <div className="text-center mb-4">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl mb-2 bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent">
            {isLoading ? "Creating Queue..." : `Queue ${queues.length > 1 ? "Numbers" : "Number"} Assigned!`}
          </h2>
          <p className="text-sm text-slate-400">
            {error || (isLoading ? "Please wait while we save your request" : `You have successfully registered for ${queues.length} ${queues.length > 1 ? "services" : "service"}`)}
          </p>
        </div>

        {!isLoading && !error && (
          <div className={`grid grid-cols-1 ${queues.length > 1 ? "lg:grid-cols-2" : "max-w-2xl mx-auto"} gap-4 mb-4`}>
            {queues.map((queue) => {
              const Icon = queue.icon;
              const isConsultation = queue.id === "consultation";
              return (
                <div key={queue.ticket._id} className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${queue.gradient} rounded-lg blur-md opacity-50`} />
                      <div className={`relative w-10 h-10 bg-gradient-to-br ${queue.gradient} rounded-lg flex items-center justify-center shadow-xl`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-base">{queue.title}</h3>
                  </div>

                  <div className={`bg-gradient-to-br ${isConsultation ? "from-indigo-500/10 to-blue-500/10 border-indigo-500/30" : "from-purple-500/10 to-pink-500/10 border-purple-500/30"} rounded-xl p-4 mb-4 text-center border-2 border-dashed`}>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Your Queue Number</p>
                    <p className={`text-5xl bg-gradient-to-r ${isConsultation ? "from-indigo-400 to-blue-400" : "from-purple-400 to-pink-400"} bg-clip-text text-transparent`}>
                      {queue.queueNumber}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                      <p className="text-base mb-0.5">{queue.currentServing}</p>
                      <p className="text-xs text-slate-400">Now Serving</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                      <p className="text-base mb-0.5">{queue.peopleAhead}</p>
                      <p className="text-xs text-slate-400">People Ahead</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-400 mb-1">Important</p>
                <p className="text-sm text-slate-300">
                  Please stay near the clinic area. You will be notified when it's your turn for each service.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleGoToDashboard}
            disabled={isLoading}
            className="relative w-full group overflow-hidden bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Home className="w-4 h-4 relative z-10" />
            <span className="relative z-10 text-sm">Go to Dashboard</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
