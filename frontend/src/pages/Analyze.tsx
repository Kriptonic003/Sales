import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatError } from "../api/client";
import type { SalesLossPredictionResponse, SentimentAnalysisResponse } from "../api/types";
import LoadingSkeleton from "../components/LoadingSkeleton";

type Platform = "YouTube";

const defaultDates = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

export default function AnalyzePage() {
  const navigate = useNavigate();

  const [product, setProduct] = useState("NeoGadget");
  const [brand, setBrand] = useState("BlueNova");
  const [platform] = useState<Platform>("YouTube");
  const [range, setRange] = useState(defaultDates);
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState<SentimentAnalysisResponse | null>(null);
  const [prediction, setPrediction] = useState<SalesLossPredictionResponse | null>(null);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const sentimentResp = await api.post<SentimentAnalysisResponse>("/analyze-sentiment", {
        product_name: product,
        brand_name: brand,
        platform,
        start_date: range.start,
        end_date: range.end,
      });

      setSentiment(sentimentResp.data);

      const predictionResp = await api.post<SalesLossPredictionResponse>("/predict-sales-loss", {
        product_name: product,
        brand_name: brand,
        platform,
        start_date: range.start,
        end_date: range.end,
      });

      setPrediction(predictionResp.data);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
      {/* INPUT PANEL */}
      <div className="glass neon-border rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200/70">Input</p>
            <h2 className="text-2xl font-semibold text-white">Product Analysis</h2>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-ghost rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">Product name</label>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cyan-500/30 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Brand name</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cyan-500/30 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>

          {/* FIXED PLATFORM */}
          <div>
            <label className="text-sm text-slate-300">Platform</label>
            <input
              value="YouTube"
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-xl border border-cyan-500/30 bg-slate-900 px-3 py-2 text-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm text-slate-300">Start date</label>
              <input
                type="date"
                value={range.start}
                onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-cyan-500/30 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">End date</label>
              <input
                type="date"
                value={range.end}
                onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-cyan-500/30 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={submit}
            className="btn-primary rounded-xl px-5 py-3 text-sm"
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Run analysis"}
          </button>
          {error && <div className="text-sm text-rose-300">{error}</div>}
        </div>
      </div>

      {/* RESULTS PANEL */}
      <div className="glass neon-border rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">Results</h3>

        {loading && <LoadingSkeleton lines={5} />}

        {!loading && sentiment && prediction && (
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-cyan-500/25 bg-slate-900/70 p-3">
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Sentiment</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {sentiment.average_sentiment.toFixed(2)} score
              </div>
              <div className="text-sm text-slate-300">
                {sentiment.total_posts} posts ·{" "}
                {sentiment.negative_percentage.toFixed(1)}% negative
              </div>
            </div>

            <div className="rounded-xl border border-cyan-500/25 bg-slate-900/70 p-3">
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Prediction</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {prediction.predicted_drop_percentage.toFixed(1)}% projected drop
              </div>
              <div className="text-sm text-slate-300">
                Loss probability {(prediction.loss_probability * 100).toFixed(1)}% · Risk{" "}
                {prediction.risk_level}
              </div>
              <div className="mt-2 text-slate-300">{prediction.explanation}</div>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="btn-ghost w-full rounded-xl px-4 py-3 text-sm"
            >
              Open Dashboard
            </button>
          </div>
        )}

        {!loading && !sentiment && (
          <div className="mt-2 text-sm text-slate-400">
            Run an analysis to see sentiment and risk results.
          </div>
        )}
      </div>
    </div>
  );
}
