import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Pie,
  PieChart,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { api, formatError } from "../api/client";
import type { DashboardResponse } from "../api/types";
import KPICard from "../components/KPICard";
import ChartCard from "../components/ChartCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import AlertBanner from "../components/AlertBanner";
import ChatPanel from "../components/ChatPanel";

const PIE_COLORS = ["#22d3ee", "#38bdf8", "#6366f1"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<DashboardResponse>("/get-dashboard-data", {
        params: {
          product_name: "NeoGadget",
          brand_name: "BlueNova",
          platform: "YouTube", // 🔒 Locked to YouTube
        },
      });
      setData(res.data);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const hasComments =
    data &&
    Array.isArray(data.comment_volume) &&
    data.comment_volume.length > 0;

  const hasSales =
    data &&
    Array.isArray(data.sales_series) &&
    data.sales_series.length > 0;

  const kpiTone = (risk: string) => {
    if (risk === "High") return "bad";
    if (risk === "Medium") return "warn";
    return "good";
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
      {/* LEFT SECTION */}
      <div className="space-y-4">
        {/* KPI CARDS */}
        <div className="grid gap-3 md:grid-cols-4 sm:grid-cols-2">
          {loading && <LoadingSkeleton lines={4} />}

          {!loading && data && hasComments && (
            <>
              <KPICard
                label="Average Sentiment"
                value={data.kpis.average_sentiment.toFixed(2)}
                subtext="30d rolling"
                tone={kpiTone(data.kpis.risk_level) as any}
              />
              <KPICard
                label="% Negative"
                value={`${data.kpis.negative_percentage.toFixed(1)}%`}
                subtext="YouTube comments"
                tone={data.kpis.negative_percentage > 35 ? "bad" : "warn"}
              />
              <KPICard
                label="Predicted Sales Drop"
                value={`${data.kpis.predicted_sales_drop.toFixed(1)}%`}
                subtext="Short-term"
                tone={kpiTone(data.kpis.risk_level) as any}
              />
              <KPICard
                label="Risk Level"
                value={data.kpis.risk_level}
                tone={kpiTone(data.kpis.risk_level) as any}
              />
            </>
          )}
        </div>

        {/* NO DATA MESSAGE */}
        {!loading && data && !hasComments && (
          <div className="glass neon-border rounded-2xl p-5 text-slate-400">
            No YouTube comments available to display dashboard analytics.
          </div>
        )}

        {/* CHARTS */}
        {!loading && data && hasComments && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <ChartCard title="Sentiment Trend (30d)">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.sentiment_trend}>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[-1, 1]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="average_sentiment"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Sentiment Distribution">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(data.sentiment_distribution).map(
                        ([name, value]) => ({ name, value })
                      )}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {Object.keys(data.sentiment_distribution).map(
                        (_, index) => (
                          <Cell
                            key={index}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {hasComments && (
                <ChartCard title="Comment Volume">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.comment_volume}>
                      <XAxis dataKey="date" hide />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="total_posts"
                        fill="#22d3ee"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {hasSales && (
                <ChartCard title="Actual vs Predicted Sales">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.sales_series}>
                      <XAxis dataKey="date" hide />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="actual_revenue"
                        stroke="#38bdf8"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted_revenue"
                        stroke="#22d3ee"
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          </>
        )}

        {/* AI INSIGHTS */}
        {!loading && data && hasComments && (
          <div className="glass neon-border rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">AI Insights</h3>
              <button
                onClick={fetchData}
                className="rounded-lg border border-cyan-500/30 px-3 py-2 text-xs text-cyan-100 hover:border-cyan-400"
              >
                Refresh
              </button>
            </div>

            <ul className="mt-3 space-y-2 text-slate-200">
              {data.ai_insights.map((i, idx) => (
                <li key={idx} className="rounded-lg bg-slate-900/60 px-3 py-2">
                  {i}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <AlertBanner message={error} tone="error" />}
      </div>

      {/* RIGHT PANEL */}
      <div className="space-y-4">
        <ChatPanel />
        <div className="glass neon-border rounded-2xl p-4">
          <h3 className="text-lg font-semibold text-white">Explanation</h3>
          <p className="mt-2 text-sm text-slate-300">
            We aggregate YouTube comment sentiment, classify polarity, and blend
            with historical revenue. Logistic regression estimates loss
            probability; linear regression projects near-term revenue.
          </p>
        </div>
      </div>
    </div>
  );
}
