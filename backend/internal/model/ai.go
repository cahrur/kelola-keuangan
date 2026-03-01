package model

import "time"

// ChatSession represents a conversation session for AI chat
type ChatSession struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index;not null"`
	Title     string    `json:"title" gorm:"size:200;not null;default:'Chat baru'"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ChatMessage represents a single message in a chat session
type ChatMessage struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	SessionID uint      `json:"session_id" gorm:"index;not null"`
	Role      string    `json:"role" gorm:"size:20;not null"` // system, user, assistant
	Content   string    `json:"content" gorm:"type:text;not null"`
	CreatedAt time.Time `json:"created_at"`
}

// UserAIConfig stores per-user AI configuration overrides
type UserAIConfig struct {
	ID           uint   `json:"id" gorm:"primaryKey"`
	UserID       uint   `json:"user_id" gorm:"uniqueIndex;not null"`
	BaseURL      string `json:"base_url" gorm:"size:500"`
	APIKey       string `json:"-" gorm:"size:500"`       // never returned to frontend
	APIKeyMasked string `json:"api_key_masked" gorm:"-"` // computed, not stored
	Model        string `json:"model" gorm:"size:100"`
	CustomPrompt string `json:"custom_prompt" gorm:"type:text"`
}

// Request DTOs
type ChatRequest struct {
	SessionID uint   `json:"session_id"`
	Message   string `json:"message" binding:"required"`
}

type UpdateAIConfigRequest struct {
	BaseURL      string `json:"base_url"`
	APIKey       string `json:"api_key"`
	Model        string `json:"model"`
	CustomPrompt string `json:"custom_prompt"`
}

// MaskAPIKey returns a masked version of the API key
func (c *UserAIConfig) MaskAPIKey() string {
	if c.APIKey == "" {
		return ""
	}
	if len(c.APIKey) <= 8 {
		return "••••••••"
	}
	return c.APIKey[:4] + "••••••••" + c.APIKey[len(c.APIKey)-4:]
}
