var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapPost("/analyze", (AnalyzeRequest request) =>
{
    var result = ContentAnalyzer.Analyze(request.Content, request.Url);
    return Results.Ok(result);
})
.WithName("AnalyzeContent");

app.Run();


// =================== ANALIZ MANTIGI ===================

static class ContentAnalyzer
{
    public static AnalyzeResponse Analyze(string? content, string? url)
    {
        int score = 0;
        var signals = new List<string>();

        // --- METIN ANALIZI ---
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

        // --- LINK ANALIZI ---
        if (!string.IsNullOrWhiteSpace(url))
        {
            var (linkScore, linkSignals) = AnalyzeUrl(url);
            score += linkScore;
            signals.AddRange(linkSignals);
        }

        // Puani risk seviyesine cevir
        string riskLevel = score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";

        if (signals.Count == 0)
            signals.Add("Belirgin bir risk sinyali tespit edilmedi.");

        return new AnalyzeResponse(riskLevel, score, signals);
    }

    // --- Link kontrolleri ayri bir metotta ---
    static (int score, List<string> signals) AnalyzeUrl(string url)
    {
        int score = 0;
        var signals = new List<string>();

        // URL'yi ayristirmayi dene; gecersizse uyar
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            signals.Add("Link gecerli bir adres olarak ayristirilamadi.");
            score += 20;
            return (score, signals);
        }

        var host = uri.Host.ToLowerInvariant();

        // KURAL 1: HTTPS kullaniyor mu?
        if (uri.Scheme != "https")
        {
            score += 20;
            signals.Add("Link HTTPS kullanmiyor (guvensiz baglanti).");
        }

        // KURAL 2: Host bir IP adresi mi? (meşru siteler alan adi kullanir)
        if (System.Net.IPAddress.TryParse(host, out _))
        {
            score += 30;
            signals.Add("Link alan adi yerine dogrudan IP adresi kullaniyor.");
        }

        // KURAL 3: Domain asiri uzun mu?
        if (host.Length > 30)
        {
            score += 15;
            signals.Add("Alan adi asiri uzun (karmasik/supheli olabilir).");
        }

        // KURAL 4: Domain'de cok fazla tire veya rakam var mi?
        int digitCount = host.Count(char.IsDigit);
        int dashCount = host.Count(c => c == '-');
        if (digitCount >= 4 || dashCount >= 3)
        {
            score += 15;
            signals.Add("Alan adinda fazla sayida rakam veya tire var.");
        }

        // KURAL 5: Link kisaltici mi?
        string[] shorteners = { "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly", "cutt.ly" };
        if (shorteners.Any(s => host == s || host.EndsWith("." + s)))
        {
            score += 25;
            signals.Add("Link kisaltici kullanilmis (gercek hedef gizlenmis olabilir).");
        }

        // KURAL 6: Alt-alan derinligi supheli mi? (marka taklidi: garanti.com.sahte.xyz)
        // Nokta sayisi cok fazlaysa, bir markanin arkasina sahte domain eklenmis olabilir
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

// Content = mail metni (opsiyonel), Url = analiz edilecek link (opsiyonel)
record AnalyzeRequest(string? Content, string? Url);
record AnalyzeResponse(string RiskLevel, int Score, List<string> Signals);