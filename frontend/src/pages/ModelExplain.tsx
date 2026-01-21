export default function ModelExplainPage() {
  return (
    <div className="glass neon-border rounded-2xl p-6 space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Model</p>
        <h2 className="text-2xl font-semibold text-white">NLP + Sales Loss Workflow</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-cyan-500/25 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold text-white">NLP stack</h3>
          <ul className="mt-2 list-disc space-y-2 pl-4 text-slate-200">
            <li>Text pre-processing: lowercase, heuristic keyword polarity.</li>
            <li>Sentiment scoring per post (-1 to 1), label mapping (pos/neu/neg).</li>
            <li>Daily aggregation for average score and negative share.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-cyan-500/25 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold text-white">Sales prediction</h3>
          <ul className="mt-2 list-disc space-y-2 pl-4 text-slate-200">
            <li>Features: rolling average sentiment, volume, historical revenue.</li>
            <li>Models: Logistic Regression for loss probability; Linear Regression for revenue.</li>
            <li>Outputs: risk level, drop %, and narrative explanation.</li>
          </ul>
        </div>
      </div>
      <div className="rounded-2xl border border-cyan-500/25 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold text-white">Flow</h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-slate-200">
          <li>Ingest Twitter/Reddit posts → preprocess + sentiment scoring.</li>
          <li>Aggregate by day → compute averages and negative %.</li>
          <li>Merge with sales history → train/retrain lightweight models.</li>
          <li>Predict drop % + probability → surface KPIs, charts, and alerts.</li>
          <li>AI Copilot (Gemini) explains risks and suggests mitigations.</li>
        </ol>
      </div>
    </div>
  );
}

