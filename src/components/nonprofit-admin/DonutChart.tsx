interface DonutChartProps {
  filled: number;
  total: number;
  centerValue: string;
  filledLabel: string;
  remainingLabel: string;
}

export default function DonutChart({ filled, total, centerValue, filledLabel, remainingLabel }: DonutChartProps) {
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;

  return (
    <div className="relative w-40 h-40 mx-auto my-2">
      <div
        className="w-full h-full rounded-full flex items-center justify-center"
        style={{ background: `conic-gradient(#00B5AD ${pct}%, #e5e7eb ${pct}% 100%)` }}
      >
        <div className="bg-white rounded-full w-28 h-28 flex items-center justify-center">
          <span className="font-bold text-gray-800 font-numeric text-lg">{centerValue}</span>
        </div>
      </div>
      <span className="absolute top-2 end-0 bg-white border border-gray-100 shadow-sm rounded-full px-2.5 py-1 text-xs font-bold text-gray-500 font-numeric">
        {remainingLabel}
      </span>
      <span className="absolute bottom-2 start-0 bg-white border border-gray-100 shadow-sm rounded-full px-2.5 py-1 text-xs font-bold text-raz-teal font-numeric">
        {filledLabel}
      </span>
    </div>
  );
}
