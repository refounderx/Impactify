interface Stat {
  label: string;
  value: string;
}

export default function StatHeader({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex w-full items-center sm:w-auto">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`flex min-w-0 flex-1 flex-col items-end px-3 first:pe-0 last:ps-0 sm:flex-none sm:px-6 ${i > 0 ? "border-s border-gray-200" : ""}`}
        >
          <span className="text-xs text-gray-500">{s.label}</span>
          <span className="truncate text-xl font-bold text-raz-teal font-numeric sm:text-2xl">{s.value}</span>
        </div>
      ))}
    </div>
  );
}
