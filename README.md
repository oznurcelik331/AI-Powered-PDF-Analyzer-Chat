AI-Powered PDF Analyzer & Chat

Bu uygulama, **Retrieval-Augmented Generation (RAG)** mimarisi kullanarak PDF belgeleri üzerinde akıllı analizler ve sohbet imkanı sunar.

Öne Çıkan Özellikler
Akıllı Analiz:** PDF dökümanlarından anında özet, kritik noktalar ve risk analizi çıkarır.
Bağlamsal Bellek:** Pinecone Vektör Veritabanı ile döküman içeriğini semantik olarak sorgular.
Hızlı AI Yanıtları:** Google Gemini 1.5 Flash modeli ile optimize edilmiş performans.

Teknik Stack
Framework:** Next.js 14 (App Router)
AI Model:** Google Gemini 1.5 Flash
Vector Store:** Pinecone DB
Language:** TypeScript & Tailwind CSS

API Limitleri ve Performans Notu
Proje, geliştirme aşamasında **Google AI Studio Ücretsiz API** katmanını kullanmaktadır. Bu nedenle:
* **Rate Limits:** Ücretsiz kotaya bağlı olarak saniyede yapılabilecek istek sayısı sınırlıdır. Hata alınması durumunda lütfen 30-60 saniye bekleyip tekrar deneyiniz.
* **Dosya Boyutu:** En iyi performans için 5MB altındaki PDF'lerin kullanılması önerilir.

Kurulum
1. `npm install`
2. `.env.example` dosyasını `.env.local` olarak kopyalayıp anahtarlarınızı ekleyin.
3. `npm run dev` ile yerel sunucuyu başlatın.
