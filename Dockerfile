FROM nginx
COPY nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /usr/share/nginx/html
COPY dist/* /usr/share/nginx/html/
