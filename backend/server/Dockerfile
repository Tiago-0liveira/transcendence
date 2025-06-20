# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN apk add --no-cache openssl bash curl nss

# Download and install mkcert as alpine does not have it in their default repositories
RUN curl -L "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64" -o /usr/local/bin/mkcert \
    && chmod +x /usr/local/bin/mkcert

# Set up SSL directory
RUN mkdir -p /etc/certs

# Create the local CA and generate the certificate
RUN mkcert -install \
    && mkcert localhost \
    && mv localhost.pem /etc/certs/selfsigned.crt \
    && mv localhost-key.pem /etc/certs/selfsigned.key

COPY . .

# Dev stage
FROM builder AS dev
CMD ["npm", "run", "dev"]

COPY --from=builder /etc/certs/ /etc/certs/

# Prod stage
FROM builder AS prod
RUN npm run build

COPY --from=builder /etc/certs/ /etc/certs/

EXPOSE 4000

CMD ["npm", "run", "start"]
