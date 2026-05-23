export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded-md q-skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="h-24 rounded-xl q-skeleton" />
        <div className="h-24 rounded-xl q-skeleton" />
        <div className="h-24 rounded-xl q-skeleton" />
        <div className="h-24 rounded-xl q-skeleton" />
      </div>
      <div className="h-64 rounded-xl q-skeleton" />
    </div>
  );
}
