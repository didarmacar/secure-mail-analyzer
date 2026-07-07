# 1. ASAMA: React uygulamasini derle
# Node imajini temel al (React'i derlemek icin gerekli)
FROM node:20 AS build
WORKDIR /app

# Once package dosyalarini kopyala ve bagimliliklari indir
COPY package*.json ./
RUN npm install

# Sonra tum kodu kopyala ve uretim icin derle
# (Bu, src/ icindeki React kodunu statik HTML/CSS/JS'e cevirir)
COPY . ./
RUN npm run build

# 2. ASAMA: Derlenen dosyalari Nginx ile sun
# Nginx, statik dosyalari sunan hafif bir web sunucusudur
FROM nginx:alpine
# Derlenen dosyalari Nginx'in sundugu klasore kopyala
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx 80 portunda dinler
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]