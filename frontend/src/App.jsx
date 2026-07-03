import { useState } from "react";
import "./App.css";

function App() {
  // Kullanicinin girdigi metin ve link (state = React'in hafizasi)
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  // Backend'den donen sonuc
  const [result, setResult] = useState(null);
  // Yukleniyor durumu (buton "Analiz ediliyor..." gostersin diye)
  const [loading, setLoading] = useState(false);

  // Analiz butonuna basilinca calisir
  async function handleAnalyze() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("http://localhost:5159/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content, url: url }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert("Backend'e baglanilamadi. Backend calisiyor mu?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Secure Mail Analyzer</h1>
      <p>Bir e-posta icerigi veya link girin, guvenlik analizini gorun.</p>

      <label>E-posta icerigi:</label>
      <textarea
        rows={5}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Mail metnini buraya yapistirin..."
      />

      <label>Link (opsiyonel):</label>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://ornek.com"
      />

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analiz ediliyor..." : "Analiz Et"}
      </button>

      {/* Sonuc geldiyse goster */}
      {result && (
        <div className="result">
          <h2>Sonuc</h2>
          <p><strong>Risk Seviyesi:</strong> {result.riskLevel}</p>
          <p><strong>Puan:</strong> {result.score}</p>
          <strong>Tespit edilen sinyaller:</strong>
          <ul>
            {result.signals.map((signal, index) => (
              <li key={index}>{signal}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;