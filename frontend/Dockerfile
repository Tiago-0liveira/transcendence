# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install openssl for self-signed certificate
RUN apk add --no-cache openssl bash curl nss

# Download and install mkcert as alpine does not have it in their default repositories
RUN curl -L "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64" -o /usr/local/bin/mkcert \
    && chmod +x /usr/local/bin/mkcert

# Set up SSL directory
RUN mkdir -p /etc/nginx/ssl

# Create the local CA and generate the certificate
RUN mkcert -install \
    && mkcert localhost \
    && mv localhost.pem /etc/nginx/ssl/nginx-selfsigned.crt \
    && mv localhost-key.pem /etc/nginx/ssl/nginx-selfsigned.key

COPY . .
RUN npm run build

# Dev stage
FROM node:18-alpine AS dev

WORKDIR /app
COPY --from=builder /app ./
COPY --from=builder /etc/nginx/ssl /etc/nginx/ssl

EXPOSE 2000

CMD ["npm", "run", "dev"]

# Prod stage
FROM nginx:alpine AS prod

# NGINX config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /etc/nginx/ssl /etc/nginx/ssl

EXPOSE 2000

CMD ["nginx", "-g", "daemon off;"]
