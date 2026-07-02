using Microsoft.EntityFrameworkCore;

namespace SecureMailAnalyzer.Api;

// EF Core'un veritabaniyla konustugu ana sinif
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Bu tablo veritabaninda "Analyses" adiyla olusacak
    public DbSet<AnalysisRecord> Analyses { get; set; }
}