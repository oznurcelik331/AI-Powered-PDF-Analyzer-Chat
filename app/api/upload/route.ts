import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";

// Tip hatasını önlemek için @ts-ignore kullanıyoruz
// Terminale şunu yazdığından emin ol: npm install pdf-parse-fork
// @ts-ignore
import pdf from "pdf-parse-fork";

// API anahtarlarını kontrol ederek tanımlıyoruz
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Pinecone bağlantısında apiKey hatasını önlemek için boşluk kontrolü ekledik
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "",
});

// Next.js'e bu rotanın Node.js ortamında çalışacağını (Buffer kullanımı için) bildiriyoruz
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    // Dosyayı Buffer'a dönüştürme
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // PDF içeriğini metne dönüştürme
    const data = await pdf(buffer);
    const text = data.text;

    if (!text) {
      throw new Error("PDF içeriği okunamadı veya dosya boş.");
    }

    // Google Gemini ile Embedding (Vektör) oluşturma
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text.substring(0, 5000));
    const embedding = result.embedding.values;

    // Pinecone veritabanına kaydetme
    const indexName = process.env.PINECONE_INDEX_NAME;
    if (!indexName) {
      throw new Error("PINECONE_INDEX_NAME çevre değişkeni eksik.");
    }

    const index = pc.index(indexName);

    await index.upsert([
      {
        // Her yüklemede benzersiz ID (pdf-170445...)
        id: `pdf-${Date.now()}`,
        values: embedding,
        metadata: {
          text: text.substring(0, 2000),
          filename: file.name,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Dosya başarıyla işlendi ve Pinecone'a eklendi.",
    });
  } catch (error: any) {
    console.error("Sistem Hatası:", error);
    return NextResponse.json(
      {
        error: "İşlem başarısız",
        details: error.message,
        hint: "Lütfen .env.local dosyanızı ve terminal bağlantınızı kontrol edin.",
      },
      { status: 500 }
    );
  }
}
