export default function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-2xl overflow-hidden mb-4 border border-slate-700 animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-slate-700" />

      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-5 bg-slate-700 rounded-full w-3/4" />

        {/* Place skeleton */}
        <div className="h-4 bg-slate-700 rounded-full w-1/2" />

        {/* Tags skeleton */}
        <div className="flex gap-2">
          <div className="h-7 bg-slate-700 rounded-full w-20" />
          <div className="h-7 bg-slate-700 rounded-full w-28" />
        </div>

        {/* Tip skeleton */}
        <div className="h-12 bg-slate-700 rounded-xl w-full" />

        {/* Footer skeleton */}
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 bg-slate-700 rounded-full w-24" />
          <div className="h-8 bg-slate-700 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}