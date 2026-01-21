import { Link, useLocation } from "react-router-dom";
import Toggle from "./Toggle";

const links = [
  { to: "/landing", label: "Home" },
  { to: "/analyze", label: "Analyze" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/comments", label: "Comments" },
  { to: "/model", label: "Model" },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="glass neon-border sticky top-0 z-20 mx-auto mt-3 flex w-[95%] items-center justify-between rounded-2xl px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-300 shadow-lg shadow-cyan-500/30" />
        <div>
          <div className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">AI Sentinel</div>
          <div className="text-lg font-semibold text-white">Sales Loss Radar</div>
        </div>
      </div>
      <nav className="hidden items-center gap-4 text-sm font-medium text-slate-200 md:flex">
        {links.map((link) => (
          <Link
            key={link.to}
            className={`rounded-full px-3 py-2 transition ${
              pathname === link.to ? "bg-cyan-500/15 text-cyan-200" : "text-slate-300 hover:text-white"
            }`}
            to={link.to}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Link
          to="/analyze"
          className="btn-ghost hidden rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide md:inline-flex"
        >
          Analyze Product
        </Link>
        <Toggle />
      </div>
    </header>
  );
}

