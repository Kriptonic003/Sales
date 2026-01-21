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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<DashboardResponse>("/get-dashboard-data", {
        params: { product_name: "NeoGadget", brand_name: "BlueNova", platform: "Twitter" },
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
  }, []);

  const kpiTone = (risk: string) => {
    if (risk === "High") return "bad";
    if (risk === "Medium") return "warn";
    return "good";
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4 sm:grid-cols-2">
          {loading && <LoadingSkeleton lines={4} />}
          {!loading && data && (
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
                subtext="Twitter/Reddit blend"
                tone={data.kpis.negative_percentage > 35 ? "bad" : "warn"}
              />
              <KPICard
                label="Predicted Sales Drop"
                value={`${data.kpis.predicted_sales_drop.toFixed(1)}%`}
                subtext="Short-term"
                tone={kpiTone(data.kpis.risk_level) as any}
              />
              <KPICard label="Risk Level" value={data.kpis.risk_level} tone={kpiTone(data.kpis.risk_level) as any} />
            </>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <ChartCard title="Sentiment Trend (30d)">
            {loading && <LoadingSkeleton lines={6} />}
            {!loading && data && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.sentiment_trend}>
                  <XAxis dataKey="date" stroke="#9ca3af" hide />
                  <YAxis stroke="#9ca3af" domain={[-1, 1]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="average_sentiment" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
          <ChartCard title="Sentiment Distribution">
            {loading && <LoadingSkeleton lines={6} />}
            {!loading && data && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(data.sentiment_distribution).map(([name, value]) => ({ name, value }))}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {Object.keys(data.sentiment_distribution).map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <ChartCard title="Comment Volume">
            {loading && <LoadingSkeleton lines={6} />}
            {!loading && data && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.comment_volume}>
                  <XAxis dataKey="date" stroke="#9ca3af" hide />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Bar dataKey="total_posts" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
          <ChartCard title="Actual vs Predicted Sales">
            {loading && <LoadingSkeleton lines={6} />}
            {!loading && data && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.sales_series}>
                  <XAxis dataKey="date" stroke="#9ca3af" hide />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Line type="monotone" dataKey="actual_revenue" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="predicted_revenue" stroke="#22d3ee" strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

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
          {loading && <LoadingSkeleton lines={4} />}
          {!loading && data && (
            <ul className="mt-3 space-y-2 text-slate-200">
              {data.ai_insights.map((i, idx) => (
                <li key={idx} className="rounded-lg bg-slate-900/60 px-3 py-2">
                  {i}
                </li>
              ))}
            </ul>
          )}
        </div>
        {data?.alerts?.length ? data.alerts.map((a, idx) => <AlertBanner key={idx} message={a} tone="warn" />) : null}
      </div>

      <div className="space-y-4">
        <ChatPanel />
        <div className="glass neon-border rounded-2xl p-4">
          <h3 className="text-lg font-semibold text-white">Explanation</h3>
          <p className="mt-2 text-sm text-slate-300">
            We aggregate daily sentiment, classify polarity, and blend with historical revenue. Logistic regression
            estimates loss probability; linear regression projects near-term revenue. Alerts trigger when probability or
            negative share crosses thresholds.
          </p>
        </div>
      </div>
      {error && <AlertBanner message={error} tone="error" />}
    </div>
  );
}

