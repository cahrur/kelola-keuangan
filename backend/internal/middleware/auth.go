package middleware

import (
	"net/http"
	"strings"

	"catat-keuangan-backend/internal/config"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware verifies JWT access token from Authorization header
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			util.Error(c, http.StatusUnauthorized, "Authorization header required")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			util.Error(c, http.StatusUnauthorized, "Invalid authorization format")
			c.Abort()
			return
		}

		tokenString := parts[1]
		secret := []byte(config.AppConfig.JWTSecret)

		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return secret, nil
		})

		if err != nil || !token.Valid {
			util.Error(c, http.StatusUnauthorized, "Invalid or expired token")
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			util.Error(c, http.StatusUnauthorized, "Invalid token claims")
			c.Abort()
			return
		}

		// Set user ID in context for handlers
		userID, ok := claims["sub"].(float64)
		if !ok {
			util.Error(c, http.StatusUnauthorized, "Invalid user ID in token")
			c.Abort()
			return
		}

		c.Set("userID", uint(userID))
		c.Next()
	}
}
