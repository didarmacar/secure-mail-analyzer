namespace SecureMailAnalyzer.Api;

// Veritabanindaki bir analiz kaydini temsil eder (her satir = bir analiz)
public class AnalysisRecord
{
    public int Id { get; set; }                       // Otomatik artan birincil anahtar
    public string? Content { get; set; }              // Analiz edilen mail metni
    public string? Url { get; set; }                  // Analiz edilen link
    public string RiskLevel { get; set; } = "Low";    // Low / Medium / High
    public int Score { get; set; }                    // Hesaplanan puan
    public string Signals { get; set; } = "";         // Tetiklenen sinyaller (metin olarak)
    public DateTime CreatedAt { get; set; }           // Analiz tarihi
}