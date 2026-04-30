export default function Loading() {
  return (
    <div aria-busy="true" className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-36 bg-gray-200 animate-pulse rounded-lg" />
          <div className="h-4 w-24 bg-gray-200 animate-pulse rounded-lg" />
        </div>
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}
