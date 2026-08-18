interface Stat {
  label: string;
  value: string;
}

export default function StatHeader({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex items-center">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`flex flex-col items-end px-6 first:pe-0 last:ps-0 ${i > 0 ? "border-s border-gray-200" : ""}`}
        >
          <span className="text-xs text-gray-500">{s.label}</span>
          <span className="text-2xl font-bold text-raz-teal font-numeric">{s.value}</span>
        </div>
      ))}
    </div>
  );
}
