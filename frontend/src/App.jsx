import { useState } from "react";
import "./App.css";

const API = "http://localhost:5159";

function App() {
  // Hangi sekme acik: "analyze" | "history" | "admin"
  const [tab, setTab] = useState("analyze");

  // Admin token'i (giris yapildiysa dolu olur). Bos = giris yapilmamis
  const [adminToken, setAdminToken] = useState("");

  return (
    <div className="container">
      <h1>Secure Mail Analyzer</h1>

      {/* SEKME BUTONLARI */}
      <div className="tabs">
        <button
          className={tab === "analyze" ? "tab active" : "tab"}
          onClick={() => setTab("analyze")}
        >
          Analiz
        </button>
        <button
          className={tab === "history" ? "tab active" : "tab"}
          onClick={() => setTab("history")}
        >
          Gecmis
        </button>
        {/* Admin sekmesi SADECE giris yapildiysa gorunur */}
        {adminToken && (
          <button
            className={tab === "admin" ? "tab active" : "tab"}
            onClick={() => setTab("admin")}
          >
            Admin
          </button>
        )}
      </div>

      {/* AKTIF SEKMENIN ICERIGI */}
      {tab === "analyze" && <AnalyzeTab />}
      {tab === "history" && <HistoryTab />}
      {tab === "admin" && <AdminTab adminToken={adminToken} />}

      {/* Giris yapilmadiysa en altta kucuk bir admin giris alani */}
      {!adminToken && (
        <AdminLogin
          onLogin={(token) => {
            setAdminToken(token);
            setTab("admin");
          }}
        />
      )}
    </div>
  );
}

// ==================== ANALIZ SEKMESI ====================
function AnalyzeTab() {
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, url }),
      });
      const data = await response.json();
      setResult(data);
    } catch {
      alert("Backend'e baglanilamadi. Backend calisiyor mu?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
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

      {result && (
        <div className="result">
          <h2>Sonuc</h2>
          <div className={`risk-badge risk-${result.riskLevel.toLowerCase()}`}>
            Risk Seviyesi: {result.riskLevel}
          </div>
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

// ==================== GECMIS SEKMESI ====================
function HistoryTab() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    setLoading(true);
    try {
      const response = await fetch(`${API}/history`);
      const data = await response.json();
      setRecords(data);
    } catch {
      alert("Gecmis yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  // Sekme acilinca otomatik yukle
  useState(() => {
    loadHistory();
  });

  return (
    <div>
      <button onClick={loadHistory} disabled={loading}>
        {loading ? "Yukleniyor..." : "Gecmisi Yenile"}
      </button>

      {records.length === 0 && <p>Henuz analiz kaydi yok.</p>}

      {records.map((r) => (
        <div key={r.id} className="result">
          <div className={`risk-badge risk-${r.riskLevel.toLowerCase()}`}>
            {r.riskLevel}
          </div>
          <p><strong>Icerik:</strong> {r.content || "(bos)"}</p>
          <p><strong>Link:</strong> {r.url || "(bos)"}</p>
          <p><strong>Puan:</strong> {r.score}</p>
          <p><strong>Sinyaller:</strong> {r.signals}</p>
          <p><small>{new Date(r.createdAt).toLocaleString()}</small></p>
        </div>
      ))}
    </div>
  );
}

// ==================== ADMIN SEKMESI ====================
function AdminTab({ adminToken }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadStats() {
    setLoading(true);
    try {
      const response = await fetch(`${API}/stats`, {
        headers: { "X-Admin-Token": adminToken },
      });
      if (!response.ok) {
        alert("Yetkisiz erisim.");
        return;
      }
      const data = await response.json();
      setStats(data);
    } catch {
      alert("Istatistikler yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={loadStats} disabled={loading}>
        {loading ? "Yukleniyor..." : "Istatistikleri Getir"}
      </button>

      {stats && (
        <div className="result">
          <h2>Admin Istatistikleri</h2>
          <p><strong>Toplam Analiz:</strong> {stats.totalAnalyses}</p>
          <p><strong>Yuksek Riskli:</strong> {stats.highRiskCount}</p>
          <strong>Risk Dagilimi:</strong>
          <ul>
            {stats.byRiskLevel.map((item, index) => (
              <li key={index}>{item.riskLevel}: {item.count}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ==================== ADMIN GIRIS ====================
function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const response = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        alert("Sifre yanlis.");
        return;
      }
      const data = await response.json();
      onLogin(data.token);
    } catch {
      alert("Giris yapilamadi.");
    }
  }

  return (
    <div className="admin-login">
      <label>Admin girisi:</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin sifresi"
      />
      <button onClick={handleLogin}>Giris Yap</button>
    </div>
  );
}

export default App;