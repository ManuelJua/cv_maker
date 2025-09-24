FROM nginx:1.27-alpine

# Copy Nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy static assets explicitly to the web root
WORKDIR /usr/share/nginx/html
COPY index.html .
COPY styles.css .
COPY js ./js
COPY config.js ./config.js

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]