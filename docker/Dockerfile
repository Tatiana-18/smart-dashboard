FROM nginx:alpine

# Копируем nginx конфиг
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Копируем ВСЮ папку public/ как корень сайта
COPY public/ /usr/share/nginx/html/

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
