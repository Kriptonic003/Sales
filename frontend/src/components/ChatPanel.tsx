import { useState } from "react";
import { api, formatError } from "../api/client";
import type { ChatResponse } from "../api/types";

export default function ChatPanel() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string>("Ask me about sentiment risks, mitigation steps, or campaigns.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post<ChatResponse>("/chat", { message });
      setReply(data.reply);
      setMessage("");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass neon-border rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">AI Copilot (Gemini)</h3>
        {loading && <div className="text-xs text-cyan-200">Thinking...</div>}
      </div>
      <div className="text-sm text-slate-300">Get quick mitigation advice or ask about current risk drivers.</div>
      <div className="mt-3 rounded-xl border border-cyan-500/25 bg-slate-900/60 p-3 text-sm text-slate-100 min-h-[120px] whitespace-pre-line">
        {reply}
      </div>
      {error && <div className="mt-2 text-xs text-rose-300">{error}</div>}
      <div className="mt-3 flex flex-col gap-2 md:flex-row">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about sentiment trends, risks, or next actions..."
          className="flex-1 rounded-xl border border-cyan-500/25 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
        />
        <button
          onClick={send}
          disabled={loading}
          className="btn-primary rounded-xl px-4 py-2 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}

