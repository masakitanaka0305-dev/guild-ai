export default function Loading() {
  return (
    <div aria-busy="true" className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto space-y-4">
      <div className="h-48 bg-gray-200 animate-pulse rounded-2xl" />
      <div className="h-24 bg-gray-200 animate-pulse rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-2xl" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}
