import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="glass neon-border relative overflow-hidden rounded-3xl p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-700/10" />
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">AI Sentiment + Sales</p>
          <h1 className="mt-3 text-4xl font-extrabold text-white md:text-5xl">
            Predict Sales Loss from Yotube Before It Hits Revenue.
          </h1>
          <p className="mt-4 text-lg text-slate-200">
            We fuse social sentiment, volume, and your sales history to flag drops early. See risk levels, AI
            insights, and mitigation guidance in one neon dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/analyze" className="btn-primary rounded-xl px-5 py-3 text-sm">
              Analyze Product
            </Link>
            <Link to="/dashboard" className="btn-ghost rounded-xl px-5 py-3 text-sm">
              View Dashboard
            </Link>
          </div>
        </div>
        <div className="glass neon-border w-full max-w-sm rounded-2xl border border-cyan-500/25 p-4">
          <div className="text-sm font-semibold text-cyan-200">How it works</div>
          <ol className="mt-3 space-y-3 text-slate-200">
            <li>
              <span className="font-semibold text-cyan-300">1.</span> Pull Youtube videos for your product.
            </li>
            <li>
              <span className="font-semibold text-cyan-300">2.</span> Run sentiment + volume signals vs sales history.
            </li>
            <li>
              <span className="font-semibold text-cyan-300">3.</span> Get risk scores, alerts, and AI mitigation tips.
            </li>
          </ol>
          <div className="mt-4 rounded-xl bg-slate-900/70 p-3 text-sm text-slate-300">
            Risk Engine: Sales drop prediction, confidence score, and alert severity (Low / Medium / High).
          </div>
        </div>
      </div>
    </div>
  );
}

