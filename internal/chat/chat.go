package chat

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
	"jainfood/internal/db"
	"jainfood/internal/models"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO: Add proper origin checking in production
		return true
	},
}

// Hub manages WebSocket connections for chat.
type Hub struct {
	// Registered clients mapped by chat ID
	rooms map[string]map[*Client]bool
	// Inbound messages from clients
	broadcast chan *Message
	// Register requests from clients
	register chan *Client
	// Unregister requests from clients
	unregister chan *Client
	// Mutex for thread-safe operations
	mu sync.RWMutex
	// Logger
	logger *zap.Logger
}

// Client represents a WebSocket client.
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	chatID string
	userID string
}

// Message represents a chat message.
type Message struct {
	ChatID    string `json:"chat_id"`
	SenderID  string `json:"sender_id"`
	Content   string `json:"content"`
	Timestamp int64  `json:"timestamp"`
}

// NewHub creates a new Hub instance.
func NewHub(logger *zap.Logger) *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		broadcast:  make(chan *Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		logger:     logger,
	}
}

// Run starts the Hub's main loop.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.rooms[client.chatID] == nil {
				h.rooms[client.chatID] = make(map[*Client]bool)
			}
			h.rooms[client.chatID][client] = true
			h.mu.Unlock()
			h.logger.Info("client registered", zap.String("chat_id", client.chatID), zap.String("user_id", client.userID))

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.rooms[client.chatID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.send)
					if len(clients) == 0 {
						delete(h.rooms, client.chatID)
					}
				}
			}
			h.mu.Unlock()
			h.logger.Info("client unregistered", zap.String("chat_id", client.chatID), zap.String("user_id", client.userID))

		case message := <-h.broadcast:
			h.mu.RLock()
			clients := h.rooms[message.ChatID]
			h.mu.RUnlock()

			data, _ := json.Marshal(message)
			for client := range clients {
				select {
				case client.send <- data:
				default:
					h.mu.Lock()
					delete(h.rooms[message.ChatID], client)
					close(client.send)
					h.mu.Unlock()
				}
			}
		}
	}
}

// HandleWebSocket handles WebSocket connection upgrades.
func (h *Hub) HandleWebSocket(c *gin.Context) {
	chatID := c.Query("chat_id")
	userID := c.Query("user_id") // TODO: Extract from JWT in production

	if chatID == "" || userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chat_id and user_id required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		h.logger.Error("websocket upgrade failed", zap.Error(err))
		return
	}

	client := &Client{
		hub:    h,
		conn:   conn,
		send:   make(chan []byte, 256),
		chatID: chatID,
		userID: userID,
	}

	h.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		_ = c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	if err := c.conn.SetReadDeadline(time.Now().Add(60 * time.Second)); err != nil {
		c.hub.logger.Error("failed to set read deadline", zap.Error(err))
		return
	}
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	})

	for {
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.hub.logger.Error("websocket read error", zap.Error(err))
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(data, &msg); err != nil {
			continue
		}

		msg.ChatID = c.chatID
		msg.SenderID = c.userID
		msg.Timestamp = time.Now().Unix()

		// Persist message to database
		ctx := context.Background()
		if err := SaveMessage(ctx, msg.ChatID, msg.SenderID, msg.Content); err != nil {
			c.hub.logger.Error("failed to save message", zap.Error(err))
		}

		c.hub.broadcast <- &msg
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if err := c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second)); err != nil {
				c.hub.logger.Error("failed to set write deadline", zap.Error(err))
				return
			}
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			if _, err := w.Write(message); err != nil {
				c.hub.logger.Error("failed to write message", zap.Error(err))
				return
			}

			// Add queued messages to current websocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				if _, err := w.Write([]byte{'\n'}); err != nil {
					c.hub.logger.Error("failed to write newline", zap.Error(err))
					return
				}
				if _, err := w.Write(<-c.send); err != nil {
					c.hub.logger.Error("failed to write queued message", zap.Error(err))
					return
				}
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			if err := c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second)); err != nil {
				c.hub.logger.Error("failed to set write deadline for ping", zap.Error(err))
				return
			}
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// CreateChat creates a new chat room for an order.
func CreateChat(ctx context.Context, orderID string, participants []string) (*models.Chat, error) {
	id := uuid.New().String()

	_, err := db.Pool.Exec(ctx, `
		INSERT INTO chats (id, order_id, participants)
		VALUES ($1, $2, $3)
	`, id, orderID, participants)
	if err != nil {
		return nil, err
	}

	return &models.Chat{
		ID:           id,
		OrderID:      orderID,
		Participants: participants,
	}, nil
}

// GetChat retrieves a chat by ID.
func GetChat(ctx context.Context, chatID string) (*models.Chat, error) {
	chat := &models.Chat{}
	err := db.Pool.QueryRow(ctx, `
		SELECT id, order_id, participants, created_at
		FROM chats WHERE id = $1
	`, chatID).Scan(&chat.ID, &chat.OrderID, &chat.Participants, &chat.CreatedAt)
	if err != nil {
		return nil, err
	}
	return chat, nil
}

// GetChatByOrder retrieves a chat by order ID.
func GetChatByOrder(ctx context.Context, orderID string) (*models.Chat, error) {
	chat := &models.Chat{}
	err := db.Pool.QueryRow(ctx, `
		SELECT id, order_id, participants, created_at
		FROM chats WHERE order_id = $1
	`, orderID).Scan(&chat.ID, &chat.OrderID, &chat.Participants, &chat.CreatedAt)
	if err != nil {
		return nil, err
	}
	return chat, nil
}

// SaveMessage persists a chat message.
func SaveMessage(ctx context.Context, chatID, senderID, content string) error {
	id := uuid.New().String()
	_, err := db.Pool.Exec(ctx, `
		INSERT INTO messages (id, chat_id, sender_id, content)
		VALUES ($1, $2, $3, $4)
	`, id, chatID, senderID, content)
	return err
}

// GetMessages retrieves messages for a chat with pagination.
func GetMessages(ctx context.Context, chatID string, limit, offset int) ([]*models.ChatMessage, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, chat_id, sender_id, content, meta, created_at
		FROM messages
		WHERE chat_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, chatID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*models.ChatMessage
	for rows.Next() {
		m := &models.ChatMessage{}
		if err := rows.Scan(&m.ID, &m.ChatID, &m.SenderID, &m.Content, &m.Meta, &m.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, nil
}
