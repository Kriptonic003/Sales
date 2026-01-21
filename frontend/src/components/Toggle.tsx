import { useTheme } from "../theme";

export default function Toggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="relative flex h-10 w-18 items-center rounded-full border border-cyan-500/40 bg-slate-900 px-2"
      aria-label="Toggle dark mode"
    >
      <div
        className={`h-6 w-6 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/40 transition-all ${
          dark ? "translate-x-0" : "translate-x-6"
        }`}
      />
    </button>
  );
}

