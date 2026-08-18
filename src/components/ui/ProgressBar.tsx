import { percent, formatNIS } from "@/lib/mock-data";

interface ProgressBarProps {
  raised: number;
  goal: number;
  showLabels?: boolean;
  size?: "sm" | "md";
}

export default function ProgressBar({ raised, goal, showLabels = false, size = "md" }: ProgressBarProps) {
  const pct = percent(raised, goal);
  const h = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full ${h} overflow-hidden`}>
        <div
          className="bg-raz-teal rounded-full h-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1.5 text-xs">
          <span className="text-gray-500">יעד: {formatNIS(goal)}</span>
          <span className="font-bold text-raz-teal">{pct}% הושג</span>
          <span className="text-gray-700 font-medium">{formatNIS(raised)} נאסף</span>
        </div>
      )}
    </div>
  );
}
