package middleware

import (
	"strings"

	"catat-keuangan-backend/internal/config"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders adds baseline HTTP security headers for all responses.
// Values are chosen to stay compatible with existing PWA + Google OAuth + Turnstile flows.
func SecurityHeaders() gin.HandlerFunc {
	// Keep CSP explicit and additive to reduce risk of breaking existing features.
	csp := strings.Join([]string{
		"default-src 'self'",
		"base-uri 'self'",
		"frame-ancestors 'none'",
		"object-src 'none'",
		"script-src 'self' 'unsafe-inline' https://accounts.google.com https://challenges.cloudflare.com",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com data:",
		"img-src 'self' data: blob: https:",
		"connect-src 'self' https: wss:",
		"frame-src 'self' https://accounts.google.com https://challenges.cloudflare.com",
		"worker-src 'self' blob:",
		"manifest-src 'self'",
	}, "; ")

	return func(c *gin.Context) {
		h := c.Writer.Header()
		h.Set("Content-Security-Policy", csp)
		h.Set("X-Frame-Options", "DENY")
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), browsing-topics=()")
		h.Set("X-XSS-Protection", "1; mode=block")

		// HSTS only in production to avoid local development issues on HTTP.
		if config.AppConfig != nil && config.AppConfig.AppEnv == "production" {
			h.Set("Strict-Transport-Security", "max-age=31536000")
		}

		c.Next()
	}
}
