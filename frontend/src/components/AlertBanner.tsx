export default function AlertBanner({ message, tone = "warn" }: { message: string; tone?: "warn" | "error" }) {
  const colors = tone === "error" ? "bg-rose-500/10 text-rose-100 border-rose-400/50" : "bg-amber-500/10 text-amber-100 border-amber-400/50";
  return (
    <div className={`neon-border mt-2 rounded-xl border px-4 py-3 text-sm ${colors}`}>
      {message}
    </div>
  );
}

