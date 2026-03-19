FROM nginx:alpine

# Копируем все файлы приложения
COPY public/ /usr/share/nginx/html/public/
COPY src/ /usr/share/nginx/html/src/

# Копируем конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]