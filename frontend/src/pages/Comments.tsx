import { useEffect, useState } from "react";
import { api, formatError } from "../api/client";
import type { SocialPostOut } from "../api/types";
import LoadingSkeleton from "../components/LoadingSkeleton";
import AlertBanner from "../components/AlertBanner";

export default function CommentsPage() {
  const [data, setData] = useState<SocialPostOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"" | "positive" | "neutral" | "negative">("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<SocialPostOut[]>("/comments", {
        params: {
          product_name: "NeoGadget",
          brand_name: "BlueNova",
          platform: "YouTube", // 🔒 Force YouTube
          sentiment_filter: filter || undefined,
        },
      });
      setData(data);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="glass neon-border rounded-2xl p-5">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Comments</p>
          <h2 className="text-2xl font-semibold text-white">YouTube Comments Feed</h2>
        </div>

        {/* SENTIMENT FILTERS */}
        <div className="flex items-center gap-2">
          {["", "positive", "neutral", "negative"].map((f) => (
            <button
              key={f || "all"}
              onClick={() => setFilter(f as any)}
              className={`rounded-full px-3 py-2 text-xs uppercase tracking-wide ${
                filter === f
                  ? "bg-cyan-500/20 text-cyan-100"
                  : "border border-cyan-500/30 text-slate-200"
              }`}
            >
              {f === "" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* STATES */}
      {loading && <LoadingSkeleton lines={6} />}
      {error && <AlertBanner message={error} tone="error" />}

      {/* NO COMMENTS STATE */}
      {!loading && !error && data.length === 0 && (
        <div className="mt-4 text-sm text-slate-400">
          No comments to be fetched.
        </div>
      )}

      {/* COMMENTS TABLE */}
      {!loading && !error && data.length > 0 && (
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm text-slate-100">
            <thead className="bg-slate-900/70">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Sentiment</th>
                <th className="px-3 py-2">Content</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/70">
                  <td className="px-3 py-2 text-slate-300">{p.posted_at}</td>
                  <td className="px-3 py-2">{p.platform}</td>
                  <td className="px-3 py-2 capitalize text-cyan-200">
                    {p.sentiment_label || "pending"}
                  </td>
                  <td className="px-3 py-2 text-slate-200">{p.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
