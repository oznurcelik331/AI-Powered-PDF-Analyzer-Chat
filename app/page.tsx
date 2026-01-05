"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Send,
  FileText,
  CheckCircle2,
  Loader2,
  Bot,
  User,
} from "lucide-react";

export default function PDFChat() {
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Çevrimdışı");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Yeni mesaj geldiğinde otomatik aşağı kaydır
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setLoading(true);
    setStatus("Yükleniyor...");

    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setStatus("Aktif");
        alert("✅ PDF başarıyla işlendi! Şimdi sorularınızı sorabilirsiniz.");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Yükleme başarısız");
      }
    } catch (error) {
      console.error("Yükleme hatası:", error);
      setStatus("Hata");
      alert("❌ Dosya yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input || loading || status === "Çevrimdışı") return;

    const userMsg = { role: "user", content: input };
    setChat((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setStatus("Düşünüyorum...");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentInput }),
      });

      const data = await res.json();

      if (res.ok) {
        setChat((prev) => [...prev, { role: "ai", content: data.text }]);
        setStatus("Aktif");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Üzgünüm, bir yanıt oluştururken hata oluştu. Lütfen tekrar deneyin.",
        },
      ]);
      setStatus("Aktif");
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-white font-sans overflow-hidden">
      {/* Yan Menü (Sidebar) */}
      <aside className="w-72 bg-[#1e293b] p-6 border-r border-slate-700 flex flex-col gap-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FileText size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Veri Merkezi</h2>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Döküman Yönetimi
          </p>
          <label
            className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
              loading
                ? "border-slate-600 bg-slate-800/50 opacity-50 cursor-not-allowed"
                : "border-slate-500 hover:border-blue-500 hover:bg-blue-500/5"
            }`}
          >
            {loading ? (
              <Loader2 size={32} className="mb-2 text-blue-400 animate-spin" />
            ) : (
              <Upload size={32} className="mb-2 text-blue-400" />
            )}
            <span className="text-sm font-medium">
              {loading ? "İşleniyor..." : "PDF Yükle"}
            </span>
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              accept=".pdf"
              disabled={loading}
            />
          </label>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-700">
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
            <div
              className={`w-3 h-3 rounded-full shadow-[0_0_8px] ${
                status === "Aktif"
                  ? "bg-emerald-500 shadow-emerald-500"
                  : status === "Yükleniyor..."
                  ? "bg-blue-500 animate-pulse shadow-blue-500"
                  : "bg-orange-500 shadow-orange-500"
              }`}
            ></div>
            <span className="text-sm font-medium text-slate-300 text-sm italic">
              Sistem: {status}
            </span>
          </div>
        </div>
      </aside>

      {/* Ana Panel */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#0f172a]">
        {/* Header */}
        <header className="h-16 border-b border-slate-700/50 flex items-center justify-between px-8 bg-[#0f172a]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <Bot className="text-blue-400" size={24} />
            <h1 className="text-sm font-bold tracking-wide text-slate-200 uppercase">
              AI Döküman Analisti v1.0
            </h1>
          </div>
          <div className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            Gemini 1.5 Flash + Pinecone RAG
          </div>
        </header>

        {/* Mesaj Alanı */}
        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
        >
          {chat.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
              <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/20">
                <Bot size={48} className="text-blue-500 animate-bounce" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-200">
                  Nasıl yardımcı olabilirim?
                </h3>
                <p className="text-slate-400 mt-2 max-w-md">
                  Bir PDF yükleyin ve içeriği hakkında derinlemesine analizler
                  yapmamı isteyin.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                {["Özet Çıkar", "Kritik Noktalar", "Risk Analizi"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setInput(item)}
                      className="p-4 bg-[#1e293b] rounded-xl border border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-sm font-semibold shadow-lg"
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            chat.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg ${
                      msg.role === "user"
                        ? "bg-blue-600"
                        : "bg-slate-700 border border-slate-600"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User size={18} />
                    ) : (
                      <Bot size={18} />
                    )}
                  </div>
                  <div
                    className={`p-4 rounded-2xl shadow-2xl leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-[#1e293b] border border-slate-700 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </main>

        {/* Input Alanı */}
        <footer className="p-8 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-300"></div>
            <div className="relative flex gap-4 bg-[#1e293b] p-2 rounded-2xl border border-slate-700 shadow-2xl">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  status === "Çevrimdışı"
                    ? "Önce döküman yüklemelisiniz..."
                    : "Döküman hakkında soru sor..."
                }
                className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-slate-200 placeholder:text-slate-500"
                disabled={loading || status === "Çevrimdışı"}
              />
              <button
                onClick={handleSend}
                disabled={loading || status === "Çevrimdışı" || !input}
                className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  status === "Çevrimdışı" || !input
                    ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                }`}
              >
                {status === "Düşünüyorum..." ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-500 mt-3">
              Yapay zeka hatalı bilgi üretebilir. Önemli verileri döküman
              üzerinden teyit edin.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
