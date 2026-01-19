FROM golang:1.23-alpine AS build
WORKDIR /app
COPY go.mod ./
RUN go mod download || true
COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/jain-api ./cmd/api

FROM gcr.io/distroless/static
COPY --from=build /app/bin/jain-api /jain-api
EXPOSE 8080
ENTRYPOINT ["/jain-api"]
