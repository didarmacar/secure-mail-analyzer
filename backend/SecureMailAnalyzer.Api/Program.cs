using Microsoft.EntityFrameworkCore;
using SecureMailAnalyzer.Api;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Veritabani baglantisini servislere ekliyoruz
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Frontend'in (5173) backend'e baglanmasina izin ver (CORS)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:30073")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Uygulama baslarken veritabani ve tablolar yoksa otomatik olustur
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();


app.MapPost("/analyze", async (AnalyzeRequest request, AppDbContext db) =>
{
    // 1. Analizi yap
    var result = ContentAnalyzer.Analyze(request.Content, request.Url);

    // 2. Sonucu veritabanina kaydet
    var record = new AnalysisRecord
    {
        Content = request.Content,
        Url = request.Url,
        RiskLevel = result.RiskLevel,
        Score = result.Score,
        Signals = string.Join(" | ", result.Signals), // listeyi tek metne ceviriyoruz
        CreatedAt = DateTime.UtcNow
    };
    db.Analyses.Add(record);
    await db.SaveChangesAsync();

    // 3. Sonucu kullaniciya don
    return Results.Ok(result);
})
.WithName("AnalyzeContent");

// --- Gecmis analizleri listeler (en yeni en ustte) ---
app.MapGet("/history", async (AppDbContext db) =>
{
    var records = await db.Analyses
        .OrderByDescending(a => a.CreatedAt)  // en yeni kayit en ustte
        .Take(50)                             // son 50 kaydi getir
        .ToListAsync();

    return Results.Ok(records);
})
.WithName("GetHistory");

// --- Admin istatistikleri: SADECE gecerli token ile erisilebilir ---
app.MapGet("/stats", async (HttpContext http, AppDbContext db, IConfiguration config) =>
{
    // Istek basligindaki token'i al ve dogrula
    var sentToken = http.Request.Headers["X-Admin-Token"].ToString();
    var validToken = config["AdminSettings:Token"];

    if (string.IsNullOrEmpty(sentToken) || sentToken != validToken)
    {
        // Token yok veya yanlis: erisim reddedildi
        return Results.Unauthorized();
    }

    var total = await db.Analyses.CountAsync();

    var byRiskLevel = await db.Analyses
        .GroupBy(a => a.RiskLevel)
        .Select(g => new { RiskLevel = g.Key, Count = g.Count() })
        .ToListAsync();

    var highRiskCount = await db.Analyses.CountAsync(a => a.RiskLevel == "High");

    var stats = new
    {
        TotalAnalyses = total,
        HighRiskCount = highRiskCount,
        ByRiskLevel = byRiskLevel
    };

    return Results.Ok(stats);
})
.WithName("GetStats");

// --- Admin girisi: sifre dogruysa token doner ---
app.MapPost("/admin/login", (AdminLoginRequest request, IConfiguration config) =>
{
    var validPassword = config["AdminSettings:Password"];
    var token = config["AdminSettings:Token"];

    if (request.Password == validPassword)
    {
        // Sifre dogru: token'i geri ver
        return Results.Ok(new { Token = token });
    }

    // Sifre yanlis
    return Results.Unauthorized();
})
.WithName("AdminLogin");

app.Run();


// =================== ANALIZ MANTIGI ===================

static class ContentAnalyzer
{
    public static AnalyzeResponse Analyze(string? content, string? url)
    {
        int score = 0;
        var signals = new List<string>();

        if (!string.IsNullOrWhiteSpace(content))
        {
            var text = content.ToLowerInvariant();

            string[] urgencyWords = { "acil", "hemen", "son uyari", "askiya alin", "hesabiniz kapatil", "24 saat", "derhal" };
            if (urgencyWords.Any(w => text.Contains(w)))
            {
                score += 30;
                signals.Add("Aciliyet veya baski dili tespit edildi.");
            }

            string[] credentialWords = { "sifre", "parola", "tc kimlik", "kredi karti", "kart numara", "cvv", "giris yapin", "dogrulayin" };
            if (credentialWords.Any(w => text.Contains(w)))
            {
                score += 35;
                signals.Add("Sifre, odeme veya kisisel veri istegi tespit edildi.");
            }

            string[] brands = { "trendyol", "google", "microsoft", "garanti", "akbank", "ptt", "kargo", "n11", "hepsiburada" };
            if (brands.Any(b => text.Contains(b)))
            {
                score += 15;
                signals.Add("Taninan bir marka/kurum adi geciyor (taklit olabilir).");
            }

            string[] attachments = { ".exe", ".zip", ".rar", ".scr", "makro", "dosyayi acin", "eki indirin" };
            if (attachments.Any(w => text.Contains(w)))
            {
                score += 25;
                signals.Add("Supheli dosya eki ifadesi tespit edildi.");
            }

            string[] moneyWords = { "kazandiniz", "odul", "hediye", "cekilis", "bedava", "ucretsiz iphone" };
            if (moneyWords.Any(w => text.Contains(w)))
            {
                score += 20;
                signals.Add("Para/odul tuzagi ifadesi tespit edildi.");
            }
        }

        if (!string.IsNullOrWhiteSpace(url))
        {
            var (linkScore, linkSignals) = AnalyzeUrl(url);
            score += linkScore;
            signals.AddRange(linkSignals);
        }

        string riskLevel = score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";

        if (signals.Count == 0)
            signals.Add("Belirgin bir risk sinyali tespit edilmedi.");

        return new AnalyzeResponse(riskLevel, score, signals);
    }

    static (int score, List<string> signals) AnalyzeUrl(string url)
    {
        int score = 0;
        var signals = new List<string>();

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            signals.Add("Link gecerli bir adres olarak ayristirilamadi.");
            score += 20;
            return (score, signals);
        }

        var host = uri.Host.ToLowerInvariant();

        if (uri.Scheme != "https")
        {
            score += 20;
            signals.Add("Link HTTPS kullanmiyor (guvensiz baglanti).");
        }

        if (System.Net.IPAddress.TryParse(host, out _))
        {
            score += 30;
            signals.Add("Link alan adi yerine dogrudan IP adresi kullaniyor.");
        }

        if (host.Length > 30)
        {
            score += 15;
            signals.Add("Alan adi asiri uzun (karmasik/supheli olabilir).");
        }

        int digitCount = host.Count(char.IsDigit);
        int dashCount = host.Count(c => c == '-');
        if (digitCount >= 4 || dashCount >= 3)
        {
            score += 15;
            signals.Add("Alan adinda fazla sayida rakam veya tire var.");
        }

        string[] shorteners = { "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly", "cutt.ly" };
        if (shorteners.Any(s => host == s || host.EndsWith("." + s)))
        {
            score += 25;
            signals.Add("Link kisaltici kullanilmis (gercek hedef gizlenmis olabilir).");
        }

        int dotCount = host.Count(c => c == '.');
        if (dotCount >= 3)
        {
            score += 20;
            signals.Add("Alan adinda cok sayida alt-alan var (marka taklidi olabilir).");
        }

        return (score, signals);
    }
}


// =================== VERI MODELLERI ===================

record AnalyzeRequest(string? Content, string? Url);
record AnalyzeResponse(string RiskLevel, int Score, List<string> Signals);
record AdminLoginRequest(string Password);