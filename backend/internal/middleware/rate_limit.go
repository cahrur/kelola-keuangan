package middleware

import (
	"net/http"
	"sync"
	"time"

	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
)

type rateLimitEntry struct {
	count     int
	expiresAt time.Time
}

type RateLimiter struct {
	mu      sync.RWMutex
	entries map[string]*rateLimitEntry
	max     int
	window  time.Duration
}

func NewRateLimiter(max int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		entries: make(map[string]*rateLimitEntry),
		max:     max,
		window:  window,
	}
	// Cleanup expired entries periodically
	go func() {
		for {
			time.Sleep(time.Minute)
			rl.mu.Lock()
			now := time.Now()
			for key, entry := range rl.entries {
				if now.After(entry.expiresAt) {
					delete(rl.entries, key)
				}
			}
			rl.mu.Unlock()
		}
	}()
	return rl
}

func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP()

		rl.mu.Lock()
		entry, exists := rl.entries[key]
		now := time.Now()

		if !exists || now.After(entry.expiresAt) {
			rl.entries[key] = &rateLimitEntry{count: 1, expiresAt: now.Add(rl.window)}
			rl.mu.Unlock()
			c.Next()
			return
		}

		entry.count++
		if entry.count > rl.max {
			rl.mu.Unlock()
			util.Error(c, http.StatusTooManyRequests, "Too many requests, try again later")
			c.Abort()
			return
		}

		rl.mu.Unlock()
		c.Next()
	}
}
