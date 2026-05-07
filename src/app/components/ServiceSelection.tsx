import { useState } from "react";
import { useNavigate } from "react-router";
import { Stethoscope, FileText, ArrowLeft, Check, ChevronRight } from "lucide-react";
import { Logo } from "./Logo";
import { Footer } from "./Footer";

export function ServiceSelection() {
  const navigate = useNavigate();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const services = [
    {
      id: "consultation",
      title: "Medical Consultation",
      description: "General checkup, diagnosis, and medical advice",
      icon: Stethoscope,
      gradient: "from-indigo-500 to-blue-600",
      prefix: "M",
    },
    {
      id: "documentation",
      title: "Administrative Request",
      description: "Medical certificates, excuse slips, and documents",
      icon: FileText,
      gradient: "from-purple-500 to-pink-600",
      prefix: "D",
    },
  ];

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleContinue = () => {
    if (selectedServices.length > 0) {
      navigate(`/queue-confirmation?services=${selectedServices.join(",")}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col">
      <header className="bg-card/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="border-l border-white/10 pl-3 ml-1">
              <h1 className="text-base">UniQueue</h1>
              <p className="text-xs text-slate-400">Select Service</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/student")}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline text-sm">Back</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4">
        <div className="text-center mb-4">
          <h2 className="text-2xl mb-2 bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">Select Service(s)</h2>
          <p className="text-sm text-slate-400">You can select one or both services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {services.map((service) => {
            const Icon = service.icon;
            const isSelected = selectedServices.includes(service.id);
            return (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 rounded-2xl p-6 text-left hover:scale-[1.02] transition-all duration-500 group ${
                  isSelected
                    ? "border-indigo-500/50 shadow-2xl shadow-indigo-500/20"
                    : "border-white/10 hover:border-indigo-500/30"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/10 opacity-0 ${isSelected ? 'opacity-100' : 'group-hover:opacity-100'} transition-opacity duration-500`} />

                <div className="absolute top-4 right-4">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-500 to-blue-600 border-transparent scale-110"
                        : "border-white/20 group-hover:border-indigo-500/50"
                    }`}
                  >
                    {isSelected && <Check className="w-5 h-5 text-white" />}
                  </div>
                </div>

                <div className="relative">
                  <div className="relative mb-4">
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} rounded-xl blur-lg opacity-50`} />
                    <div className={`relative w-14 h-14 bg-gradient-to-br ${service.gradient} rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-base mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{service.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={selectedServices.length === 0}
            className={`relative group overflow-hidden px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
              selectedServices.length > 0
                ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:shadow-2xl hover:shadow-indigo-500/25 hover:scale-105"
                : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/10"
            }`}
          >
            {selectedServices.length > 0 && (
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            )}
            <span className="relative z-10 text-sm">
              Continue ({selectedServices.length} {selectedServices.length === 1 ? "service" : "services"} selected)
            </span>
            {selectedServices.length > 0 && (
              <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
