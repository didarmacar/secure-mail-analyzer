using System.Text.RegularExpressions;

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
    // Gelen icerigi analiz edip sonucu donuyoruz
    var result = ContentAnalyzer.Analyze(request.Content);
    return Results.Ok(result);
})
.WithName("AnalyzeContent");

app.Run();


// =================== ANALIZ MANTIGI ===================

static class ContentAnalyzer
{
    // Her kural: bir kontrol + tetiklenirse eklenecek puan + kullaniciya gosterilecek aciklama
    public static AnalyzeResponse Analyze(string content)
    {
        // Icerik bos gelirse erken don
        if (string.IsNullOrWhiteSpace(content))
        {
            return new AnalyzeResponse("Low", 0, new List<string> { "Icerik bos." });
        }

        // Kucuk harfe cevirerek arama yapiyoruz ki buyuk/kucuk harf farki onemli olmasin
        var text = content.ToLowerInvariant();

        int score = 0;
        var signals = new List<string>();

        // --- KURAL 1: Aciliyet / baski dili ---
        string[] urgencyWords = { "acil", "hemen", "son uyari", "askiya alin", "hesabiniz kapatil", "24 saat", "derhal" };
        if (urgencyWords.Any(word => text.Contains(word)))
        {
            score += 30;
            signals.Add("Aciliyet veya baski dili tespit edildi.");
        }

        // --- KURAL 2: Sifre / kisisel veri istegi ---
        string[] credentialWords = { "sifre", "parola", "tc kimlik", "kredi karti", "kart numara", "cvv", "giris yapin", "dogrulayin" };
        if (credentialWords.Any(word => text.Contains(word)))
        {
            score += 35;
            signals.Add("Sifre, odeme veya kisisel veri istegi tespit edildi.");
        }

        // --- KURAL 3: Marka / kurum taklidi ---
        string[] brands = { "trendyol", "google", "microsoft", "garanti", "akbank", "ptt", "kargo", "n11", "hepsiburada" };
        if (brands.Any(brand => text.Contains(brand)))
        {
            score += 15;
            signals.Add("Taninan bir marka/kurum adi geciyor (taklit olabilir).");
        }

        // --- KURAL 4: Supheli ek dosya uyarisi ---
        string[] attachments = { ".exe", ".zip", ".rar", ".scr", "makro", "dosyayi acin", "eki indirin" };
        if (attachments.Any(word => text.Contains(word)))
        {
            score += 25;
            signals.Add("Supheli dosya eki ifadesi tespit edildi.");
        }

        // --- KURAL 5: Para / odul tuzagi ---
        string[] moneyWords = { "kazandiniz", "odul", "hediye", "cekilis", "bedava", "ucretsiz iphone" };
        if (moneyWords.Any(word => text.Contains(word)))
        {
            score += 20;
            signals.Add("Para/odul tuzagi ifadesi tespit edildi.");
        }

        // --- Puani risk seviyesine cevir ---
        string riskLevel;
        if (score >= 60)
            riskLevel = "High";
        else if (score >= 30)
            riskLevel = "Medium";
        else
            riskLevel = "Low";

        // Hic sinyal yoksa kullaniciya bilgi verelim
        if (signals.Count == 0)
        {
            signals.Add("Belirgin bir risk sinyali tespit edilmedi.");
        }

        return new AnalyzeResponse(riskLevel, score, signals);
    }
}


// =================== VERI MODELLERI ===================

record AnalyzeRequest(string Content);
record AnalyzeResponse(string RiskLevel, int Score, List<string> Signals);