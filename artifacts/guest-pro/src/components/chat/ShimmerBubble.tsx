export function ShimmerBubble() {
  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="max-w-[72%] w-48 rounded-3xl rounded-tl-sm overflow-hidden relative">
        <div className="h-14 bg-zinc-100 relative overflow-hidden rounded-3xl rounded-tl-sm">
          <div className="shimmer-sweep absolute inset-0" />
        </div>
      </div>
    </div>
  );
}
