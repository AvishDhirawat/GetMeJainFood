FROM golang:1.24-alpine AS build
WORKDIR /app

# Install required packages
RUN apk add --no-cache git ca-certificates

# Copy go module files first for better caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/jain-api ./cmd/api

FROM gcr.io/distroless/static-debian12
COPY --from=build /app/bin/jain-api /jain-api
EXPOSE 8080
ENTRYPOINT ["/jain-api"]
