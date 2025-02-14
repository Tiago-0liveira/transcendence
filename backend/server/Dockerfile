# Build stage
FROM  node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Dev stage
FROM builder AS dev
CMD ["npm", "run", "dev"]

# Prod stage
FROM builder AS prod
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]