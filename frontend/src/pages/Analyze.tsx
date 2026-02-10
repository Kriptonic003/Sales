import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatError } from "../api/client";
import type {
  SalesLossPredictionResponse,
  SentimentAnalysisResponse,
} from "../api/types";
import LoadingSkeleton from "../components/LoadingSkeleton";

export default function AnalyzePage() {
  const navigate = useNavigate();

  // 🔒 Load initial values from localStorage
  const [product, setProduct] = useState(
    localStorage.getItem("product_name") || "NeoGadget"
  );
  const [brand, setBrand] = useState(
    localStorage.getItem("brand_name") || "BlueNova"
  );
  const [videoId, setVideoId] = useState(
    localStorage.getItem("video_id") || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentiment, setSentiment] =
    useState<SentimentAnalysisResponse | null>(null);
  const [prediction, setPrediction] =
    useState<SalesLossPredictionResponse | null>(null);

  const submit = async () => {
    if (!videoId) {
      setError("Please enter a YouTube video ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 🔹 STEP 1: Fetch YouTube comments
      await api.post("/fetch-youtube-comments", null, {
        params: {
          product_name: product,
          brand_name: brand,
          video_id: videoId,
        },
      });

      // 🔹 STEP 2: Analyze sentiment
      const sentimentResp = await api.post<SentimentAnalysisResponse>(
        "/analyze-sentiment",
        {
          product_name: product,
          brand_name: brand,
          platform: "YouTube",
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        }
      );
      setSentiment(sentimentResp.data);

      // 🔹 STEP 3: Predict sales loss
      const predictionResp =
        await api.post<SalesLossPredictionResponse>("/predict-sales-loss", {
          product_name: product,
          brand_name: brand,
          platform: "YouTube",
          start_date: "2024-01-01",
          end_date: "2024-12-31",
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
        <h2 className="text-2xl font-semibold text-white mb-4">
          Product Analysis (YouTube)
        </h2>

        <div className="grid gap-3">
          <input
            value={product}
            onChange={(e) => {
              setProduct(e.target.value);
              localStorage.setItem("product_name", e.target.value);
            }}
            placeholder="Product name"
            className="rounded-xl border border-cyan-500/30 bg-slate-950 px-3 py-2 text-white"
          />

          <input
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              localStorage.setItem("brand_name", e.target.value);
            }}
            placeholder="Brand name"
            className="rounded-xl border border-cyan-500/30 bg-slate-950 px-3 py-2 text-white"
          />

          <input
            value={videoId}
            onChange={(e) => {
              setVideoId(e.target.value);
              localStorage.setItem("video_id", e.target.value);
            }}
            placeholder="YouTube Video ID (e.g. dQw4w9WgXcQ)"
            className="rounded-xl border border-cyan-500/30 bg-slate-950 px-3 py-2 text-white"
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="mt-5 btn-primary rounded-xl px-5 py-3"
        >
          {loading ? "Analyzing..." : "Run Analysis"}
        </button>

        {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
      </div>

      {/* RESULTS PANEL */}
      <div className="glass neon-border rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">Results</h3>

        {loading && <LoadingSkeleton lines={5} />}

        {!loading && sentiment && prediction && (
          <div className="mt-4 space-y-3">
            <div className="bg-slate-900/70 rounded-xl p-3">
              <p className="text-cyan-200">Average Sentiment</p>
              <p className="text-2xl text-white">
                {sentiment.average_sentiment.toFixed(2)}
              </p>
            </div>

            <div className="bg-slate-900/70 rounded-xl p-3">
              <p className="text-cyan-200">Predicted Sales Drop</p>
              <p className="text-2xl text-white">
                {prediction.predicted_drop_percentage.toFixed(1)}%
              </p>
              <p className="text-sm text-slate-300">
                Risk: {prediction.risk_level}
              </p>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="btn-ghost w-full rounded-xl py-3"
            >
              View Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
