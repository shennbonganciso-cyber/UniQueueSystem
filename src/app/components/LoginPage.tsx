import { useState } from "react";
import { useNavigate } from "react-router";
import { LogIn, User, Lock, UserCircle, Stethoscope, ArrowLeft, Sparkles } from "lucide-react";
import { Logo } from "./Logo";
import { Footer } from "./Footer";

type PortalType = "student" | "staff" | null;

export function LoginPage() {
  const navigate = useNavigate();
  const [selectedPortal, setSelectedPortal] = useState<PortalType>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPortal === "student") {
      navigate("/student");
    } else {
      navigate("/staff");
    }
  };

  if (selectedPortal === null) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header with Logo */}
        <header className="relative z-10 bg-card/50 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-2.5">
            <Logo size="md" variant="both" />
          </div>
        </header>

        <div className="relative z-10 flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-slate-300">Welcome UCnians!</span>
              </div>
              <div className="mb-4 flex justify-center">
                <div className="relative flex justify-center items-center">
                {/* Glow layer */}
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="w-[180px] h-[180px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 blur-3xl opacity-40 animate-pulse rounded-full" />
                </div>

                {/* Optional second softer glow */}
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="w-[240px] h-[240px] bg-purple-500/20 blur-[100px] rounded-full" />
                </div>

                {/* Your actual logo (unchanged) */}
                <div className="relative z-10">
                  <Logo size="xxl" variant="uniqueue" />
                </div>
              </div>
              </div>
              <p className="text-sm text-slate-400 max-w-2xl mx-auto">
                Select your access type to continue
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <button
                onClick={() => setSelectedPortal("student")}
                className="group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-indigo-500/50 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                      <UserCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl mb-2">Student</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">Join clinic queues and monitor your position in real-time</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedPortal("staff")}
                className="group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                      <Stethoscope className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl mb-2">Clinic Staff</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">Manage queues, monitor activity, and access clinic reports</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  const isStudent = selectedPortal === "student";
  const gradientFrom = isStudent ? "from-indigo-500" : "from-purple-500";
  const gradientTo = isStudent ? "to-blue-600" : "to-pink-600";

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${isStudent ? 'bg-indigo-500/20' : 'bg-purple-500/20'} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${isStudent ? 'bg-blue-500/20' : 'bg-pink-500/20'} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1s' }} />
      </div>

      {/* Header with Logo */}
      <header className="relative z-10 bg-card/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <Logo size="md" variant="both" />
          <button
            onClick={() => setSelectedPortal(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to selection</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          <div className="text-center mb-6">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl blur-lg opacity-50`} />
              <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-2xl`}>
                {isStudent ? (
                  <UserCircle className="w-8 h-8 text-white" />
                ) : (
                  <Stethoscope className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <h1 className="text-2xl mb-2">
              {isStudent ? "Student Login" : "Clinic Staff Login"}
            </h1>
            <p className="text-sm text-slate-400">
              {isStudent ? "Join queues" : "Manage clinic operations"}
            </p>
          </div>

          <div className="bg-card backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-xs mb-2">
                  {isStudent ? "Student ID" : "Staff ID"}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    placeholder={isStudent ? "Enter student ID" : "Enter staff ID"}
                    className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`relative w-full group overflow-hidden bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white py-2.5 rounded-xl hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2`}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <LogIn className="w-4 h-4 relative z-10" />
                <span className="relative z-10 text-sm">Sign In</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
