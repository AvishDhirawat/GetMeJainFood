FROM golang:1.21-alpine AS build
WORKDIR /app

# Install required packages
RUN apk add --no-cache git

# Copy go module files first for better caching
COPY go.mod go.sum ./

# Copy source code
COPY . .

# Update dependencies and build the binary
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/jain-api ./cmd/api

FROM gcr.io/distroless/static
COPY --from=build /app/bin/jain-api /jain-api
EXPOSE 8080
ENTRYPOINT ["/jain-api"]
