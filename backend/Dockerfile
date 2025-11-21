# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copiar go.mod
COPY go.mod ./

# Copiar código fuente
COPY . .

# Descargar dependencias y generar go.sum
RUN go mod download && go mod tidy

# Compilar
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api

# Run stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copiar binario
COPY --from=builder /app/main .

# Exponer puerto
EXPOSE 8080

# Comando de inicio
CMD ["./main"]
