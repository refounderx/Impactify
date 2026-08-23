export default function AdminDataStatus({ loading, error, reload }: {
  loading: boolean;
  error: string | null;
  reload: () => void;
}) {
  if (loading) return <div className="bg-white rounded-2xl p-8 text-gray-500">Loading dashboard data…</div>;
  if (!error) return null;
  return <div className="bg-white rounded-2xl p-8">
    <p className="font-bold text-red-700 mb-2">Couldn&apos;t load dashboard data</p>
    <p className="text-sm text-gray-500 mb-4">{error}</p>
    <button onClick={reload} className="bg-raz-teal text-white px-4 py-2 rounded-xl text-sm">Retry</button>
  </div>;
}
