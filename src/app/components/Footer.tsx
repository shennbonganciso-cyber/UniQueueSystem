export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-card/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
         <p className="text-xs text-slate-400 italic font-sans">
          Smarter queues, better care.
        </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>SEA Solutions</span>
            <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
            <span>© 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
