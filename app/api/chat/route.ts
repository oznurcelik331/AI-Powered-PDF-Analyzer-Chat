import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

// Yardımcı fonksiyon: Belirtilen süre kadar kodun çalışmasını durdurur
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt eksik" }, { status: 400 });
    }

    const index = pc.index(process.env.PINECONE_INDEX_NAME!);

    // --- 1. ADIM: EMBEDDING (HATA YÖNETİMLİ) ---
    let result;
    try {
      // Ücretsiz katmanda ardışık hataları baştan önlemek için kısa bir bekletme
      await delay(1000);

      const embeddingModel = genAI.getGenerativeModel({
        model: "embedding-001",
      });
      result = await embeddingModel.embedContent(prompt);
    } catch (err: any) {
      // Eğer hız sınırı (429) hatası alınırsa, terminaldeki 31 sn talimatına uyuyoruz
      if (err.status === 429) {
        console.warn(
          "Hız sınırı aşıldı! Google 31 saniye beklememizi istiyor..."
        );
        await delay(31500); // Güvenli olması için 31.5 saniye bekliyoruz
        const embeddingModel = genAI.getGenerativeModel({
          model: "embedding-001",
        });
        result = await embeddingModel.embedContent(prompt);
      } else {
        throw err;
      }
    }

    // --- 2. ADIM: PINECONE VEKTÖR SORGUSU ---
    const queryResponse = await index.query({
      vector: result.embedding.values,
      topK: 3,
      includeMetadata: true,
    });

    const context =
      queryResponse.matches
        ?.map((match: any) => match.metadata?.text)
        .filter(Boolean)
        .join("\n\n") || "İlgili doküman içeriği bulunamadı.";

    // --- 3. ADIM: GEMINI CHAT (HATA YÖNETİMLİ) ---
    let chatResult;
    try {
      const chatModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
      });
      const finalPrompt = `Doküman içeriği:\n${context}\n\nSoru: ${prompt}\n\nLütfen sadece yukarıdaki içeriğe dayanarak kısa bir yanıt ver.`;
      chatResult = await chatModel.generateContent(finalPrompt);
    } catch (err: any) {
      // Chat kısmında da hız sınırına takılırsa tekrar deniyoruz
      if (err.status === 429) {
        console.warn("Chat limitine takıldık, bekleyip tekrar deneniyor...");
        await delay(31500);
        const chatModel = genAI.getGenerativeModel({
          model: "gemini-1.5-flash-latest",
        });
        const finalPrompt = `Doküman içeriği:\n${context}\n\nSoru: ${prompt}\n\nLütfen sadece yukarıdaki içeriğe dayanarak kısa bir yanıt ver.`;
        chatResult = await chatModel.generateContent(finalPrompt);
      } else {
        throw err;
      }
    }

    const responseText = chatResult.response.text();
    return NextResponse.json({ text: responseText });
  } catch (error: any) {
    // Hatanın tam JSON halini terminale basarak analiz etmemizi kolaylaştırıyoruz
    console.error("KRİTİK HATA DETAYI:", JSON.stringify(error, null, 2));

    const status = error.status || 500;
    return NextResponse.json(
      {
        error:
          status === 429
            ? "Çok fazla istek. Lütfen 30 saniye sonra tekrar deneyin."
            : "API Hatası oluştu.",
        details: error.message,
      },
      { status: status }
    );
  }
}
