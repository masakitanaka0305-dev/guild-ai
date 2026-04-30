export default function Loading() {
  return (
    <div aria-busy="true" className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto space-y-4">
      <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-xl" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-28 bg-gray-200 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}
