FROM node:20-alpine

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including native build)
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm install
RUN npm run build

# Create data directory
RUN mkdir -p data

EXPOSE 3001

CMD ["node", "dist/index.js"]
