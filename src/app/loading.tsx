export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-[#E8998D] to-[#F4A261] rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4 animate-pulse">
          <span className="text-white font-bold text-2xl">L</span>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-48 bg-slate-200 rounded-lg animate-pulse mx-auto" />
          <div className="h-3 w-32 bg-slate-100 rounded-lg animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  );
}
