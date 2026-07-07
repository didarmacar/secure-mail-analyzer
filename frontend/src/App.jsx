import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:5159";

function App() {
  const [page, setPage] = useState("analyze");
  const [adminToken, setAdminToken] = useState("");

  return (
    <div className="app">
      <header className="navbar">
        <span className="brand">Secure Mail Analyzer</span>
        <nav className="nav-links">
          <button
            className={page === "analyze" ? "nav-link active" : "nav-link"}
            onClick={() => setPage("analyze")}
          >
            Analiz
          </button>
          <button
            className={page === "history" ? "nav-link active" : "nav-link"}
            onClick={() => setPage("history")}
          >
            Gecmis
          </button>
          <button
            className={page === "admin" ? "nav-link active" : "nav-link"}
            onClick={() => setPage("admin")}
          >
            Admin
          </button>
        </nav>
      </header>

      <main>
        {page === "analyze" && <AnalyzePage />}
        {page === "history" && <HistoryPage />}
        {page === "admin" && (
          <AdminPage adminToken={adminToken} onLogin={setAdminToken} />
        )}
      </main>
    </div>
  );
}

// ==================== ANALIZ (LANDING) ====================
function AnalyzePage() {
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
    <>
      {/* HERO */}
      <section className="hero">
       <div className="hero-inner">
        <div className="hero-text">
          <h1>E-posta ve Link Guvenlik Analizi</h1>
          <p className="hero-lead">
            E-postaniz phishing iceriyor mu? Analiz aracimizla ayrintilari
            kesfedin.
          </p>
          <p>
            Supheli e-postalari ve linkleri saniyeler icinde tarayin. Sistem;
            aciliyet dili, sahte linkler, marka taklidi ve kisisel veri
            isteklerini tespit ederek size dusuk, orta veya yuksek risk
            seviyesini nedenleriyle birlikte gosterir. 
          </p>
        </div>

        <div className="hero-card">
          <label>E-posta içeriği</label>
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Mail metnini buraya yapıştırın..."
          />
          <label>Link (opsiyonel)</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://ornek.com"
          />
          <button className="btn" onClick={handleAnalyze} disabled={loading}>
            {loading ? "Analiz ediliyor..." : "Analiz Et"}
          </button>

          {result && (
            <div className="result">
              <div className={`risk-badge risk-${result.riskLevel.toLowerCase()}`}>
                Risk: {result.riskLevel} ({result.score} puan)
              </div>
              <ul>
                {result.signals.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
       </div>
      </section>

      {/* NASIL CALISIR */}
      <section className="section">
       <div className="section-inner">
        <h2>Nasıl Çalışır?</h2>
        <p className="section-sub">
          Supheli bir e-postayi ya da linki analiz etmek yalnizca uc adim surer.
          Teknik bilgi gerekmez.
        </p>
        <div className="steps">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>Icerigi Girin</h3>
            <p>
              Supheli buldugunuz e-posta metnini kopyalayip giris alanina
              yapistirin veya kontrol etmek istediginiz linki girin. Ikisini
              birlikte de analiz edebilirsiniz.
            </p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>Analiz Et</h3>
            <p>
              Sistem icerigi saniyeler icinde tarar; aciliyet ve baski dili,
              sahte veya gizlenmis linkler, marka taklidi ve kisisel veri
              isteklerini tespit eder.
            </p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>Sonucu Gorun</h3>
            <p>
              Dusuk, orta veya yuksek risk seviyesini ve bu sonucun hangi
              gerekcelere dayandigini acik bir sekilde gorursunuz. Boylece
              tehlikeyi kendiniz de taniyabilirsiniz.
            </p>
          </div>
        </div>
       </div>
      </section>

      {/* NEDEN ONEMLI */}
      <section className="section light">
       <div className="section-inner">
        <h2>Neden Önemli?</h2>
        <p className="section-sub">
          Oltalama, bugun en yaygin ve en tehlikeli siber tehditlerden biridir.
          Fark etmek ise ogrenilebilir bir beceridir.
        </p>
        <div className="info-cards">
          <div className="info-card">
            <h3>Oltalama Saldirilari</h3>
            <p>
              Siber saldirilarin buyuk cogunlugu bir e-posta ile baslar.
              Saldirganlar sizi acele ettirmek icin baski dili kullanir, taninan
              markalari taklit eder ve sizi sahte sitelere yonlendiren linkler
              gonderir. Tek bir yanlis tiklama, hesaplarinizin ele gecirilmesine
              yol acabilir.
            </p>
          </div>
          <div className="info-card">
            <h3>Farkindalik Kazanin</h3>
            <p>
              Bu arac gercek bir saldiri yapmaz veya hicbir veriyi disariya
              gondermez. Amaci tamamen egiticidir: supheli isaretlerin neler
              oldugunu somut orneklerle gostererek, bir sonraki oltalama
              girisimini kendi basiniza fark etmenizi saglar.
            </p>
          </div>
        </div>
       </div>
      </section>
    </>
  );
}

// ==================== GECMIS ====================
function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    setLoading(true);
    try {
      const response = await fetch(`${API}/history`);
      const data = await response.json();
      setRecords(data);
    } catch {
      alert("Geçmis yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <section className="page">
      <h1>Analiz Geçmişi</h1>
      <p className="section-sub">Daha önce analiz edilen içeriklerin kaydı.</p>
      <button className="btn" onClick={loadHistory} disabled={loading}>
        {loading ? "Yükleniyor..." : "Yenile"}
      </button>

      {records.length === 0 && <p className="empty">Henüz analiz kaydı yok.</p>}

      {records.map((r) => (
        <div key={r.id} className="record">
          <div className={`risk-badge risk-${r.riskLevel.toLowerCase()}`}>
            {r.riskLevel} ({r.score} puan)
          </div>
          <p><strong>İçerik:</strong> {r.content || "(bos)"}</p>
          <p><strong>Link:</strong> {r.url || "(bos)"}</p>
          <p className="signals-text">{r.signals}</p>
          <p className="timestamp">{new Date(r.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </section>
  );
}

// ==================== ADMIN ====================
function AdminPage({ adminToken, onLogin }) {
  if (!adminToken) return <AdminLogin onLogin={onLogin} />;
  return <AdminStats adminToken={adminToken} />;
}

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
    <section className="page">
      <h1>Admin Girişi</h1>
      <p className="section-sub">İstatistikleri görmek için giriş yapın.</p>
      <div className="login-card">
        <label>Admin şifresi</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sifre"
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        <button className="btn" onClick={handleLogin}>
          Giriş Yap
        </button>
      </div>
    </section>
  );
}

function AdminStats({ adminToken }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadStats() {
    setLoading(true);
    try {
      const response = await fetch(`${API}/stats`, {
        headers: { "X-Admin-Token": adminToken },
      });
      if (!response.ok) {
        alert("Yetkisiz erişim.");
        return;
      }
      const data = await response.json();
      setStats(data);
    } catch {
      alert("İstatistikler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <section className="page">
      <h1>Admin Paneli</h1>
      <p className="section-sub">Genel analiz istatistikleri.</p>
      <button className="btn" onClick={loadStats} disabled={loading}>
        {loading ? "Yukleniyor..." : "Yenile"}
      </button>

      {stats && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Toplam Analiz</span>
              <span className="stat-value">{stats.totalAnalyses}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Yüksek Riskli</span>
              <span className="stat-value">{stats.highRiskCount}</span>
            </div>
          </div>
          <div className="record">
            <h2>Risk Dağılımı</h2>
            <ul>
              {stats.byRiskLevel.map((item, i) => (
                <li key={i}>{item.riskLevel}: {item.count}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}

export default App;