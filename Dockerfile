# === Stage 1: Build Frontend ===
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci

# Build frontend
COPY index.html vite.config.js ./
COPY public/ ./public/
COPY src/ ./src/
RUN npm run build

# === Stage 2: Production ===
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy pre-built Go binary (built locally, pushed to GitHub)
COPY backend/server-backend .
RUN chmod +x ./server-backend

# Copy frontend build output
COPY --from=frontend-builder /app/dist ./dist

EXPOSE ${APP_PORT:-8000}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${APP_PORT:-8000}/health || exit 1

CMD ["./server-backend"]
