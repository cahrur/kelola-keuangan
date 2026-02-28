# File ini yang dipakai Coolify
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binary yang sudah di-build di lokal
COPY server_binary .

# Pastikan binary bisa dieksekusi
RUN chmod +x ./server_binary

EXPOSE ${APP_PORT:-8000}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${APP_PORT:-8000}/health || exit 1

CMD ["./server_binary"]
