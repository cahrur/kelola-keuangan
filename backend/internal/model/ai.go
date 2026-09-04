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

// AIInsightCache stores daily AI insight cache per user
type AIInsightCache struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"uniqueIndex;not null"`
	Content   string    `json:"content" gorm:"type:text;not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// AIUsageLog records one AI call: how many tokens it burned, on whose key, and
// whether it worked.
//
// Deliberately metrics only. The prompt and the reply are not stored here: the
// conversation already lives in ChatMessage, and buildSystemPrompt injects the
// user's entire financial picture into every request. Copying that into a log
// table would duplicate the most sensitive data in the system for no gain.
//
// Failed calls are recorded too. A request that dies mid-flight can still be
// billed by the provider, and the failure rows are what turn a report of "the
// AI is broken" into something diagnosable.
type AIUsageLog struct {
	ID        uint  `json:"id" gorm:"primaryKey"`
	UserID    uint  `json:"user_id" gorm:"index;not null"`
	SessionID *uint `json:"session_id" gorm:"index"` // null for insight and voice

	Feature string `json:"feature" gorm:"size:30;index;not null"` // chat, insight, voice
	Model   string `json:"model" gorm:"size:100;index"`

	// KeySource separates cost we pay from cost the user pays with their own
	// key from Settings. Without it a spend dashboard is simply wrong.
	KeySource string `json:"key_source" gorm:"size:20;index;not null"` // server, user

	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`

	Success      bool   `json:"success" gorm:"index"`
	ErrorMessage string `json:"error_message" gorm:"size:500"`
	DurationMs   int    `json:"duration_ms"`

	CreatedAt time.Time `json:"created_at" gorm:"index"`
}
