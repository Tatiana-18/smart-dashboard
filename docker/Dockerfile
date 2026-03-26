FROM nginx:alpine

# Копируем nginx конфиг
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Копируем статику
COPY public/ /usr/share/nginx/html/public/

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
