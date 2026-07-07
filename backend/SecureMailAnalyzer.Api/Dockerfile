# 1. ASAMA: Kodu derle
# .NET SDK imajini temel al (derleme icin gerekli araclari icerir)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Once proje dosyasini kopyala ve bagimliliklari indir
# (Bu sirayla yapmak, kod degisince bagimliliklarin tekrar inmesini onler)
COPY *.csproj ./
RUN dotnet restore

# Sonra tum kodu kopyala ve yayina hazir sekilde derle
COPY . ./
RUN dotnet publish -c Release -o /app

# 2. ASAMA: Sadece calistirmak icin gereken hafif imaj
# (SDK yerine daha kucuk runtime imajini kullaniyoruz)
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app ./

# Uygulamanin dinleyecegi portu ayarla
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Container basladiginda uygulamayi calistir
ENTRYPOINT ["dotnet", "SecureMailAnalyzer.Api.dll"]