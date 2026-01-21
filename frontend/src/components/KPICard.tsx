interface Props {
  label: string;
  value: string;
  subtext?: string;
  tone?: "good" | "warn" | "bad";
}

const toneStyles: Record<NonNullable<Props["tone"]>, string> = {
  good: "text-emerald-300",
  warn: "text-amber-300",
  bad: "text-rose-300",
};

export default function KPICard({ label, value, subtext, tone = "good" }: Props) {
  return (
    <div className="glass neon-border rounded-2xl p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneStyles[tone]}`}>{value}</div>
      {subtext && <div className="text-sm text-slate-400">{subtext}</div>}
    </div>
  );
}

