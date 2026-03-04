package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"catat-keuangan-backend/internal/config"
	"catat-keuangan-backend/internal/model"
	"catat-keuangan-backend/internal/service"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type GoogleAuthHandler struct {
	DB               *gorm.DB
	AuthService      *service.AuthService
	TurnstileService *service.TurnstileService
}

func NewGoogleAuthHandler(db *gorm.DB, authService *service.AuthService, turnstileService *service.TurnstileService) *GoogleAuthHandler {
	return &GoogleAuthHandler{
		DB:               db,
		AuthService:      authService,
		TurnstileService: turnstileService,
	}
}

type googleLoginRequest struct {
	Credential     string `json:"credential" binding:"required"`
	Phone          string `json:"phone"`
	TurnstileToken string `json:"turnstile_token"`
}

type googleTokenInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Aud           string `json:"aud"`
}

func (h *GoogleAuthHandler) GoogleLogin(c *gin.Context) {
	var req googleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", "Invalid request body")
		return
	}

	if err := h.TurnstileService.Verify(req.TurnstileToken, c.ClientIP()); err != nil {
		util.Error(c, http.StatusUnauthorized, "Captcha verification failed")
		return
	}

	// Verify Google ID token via Google's tokeninfo endpoint
	tokenInfo, err := verifyGoogleToken(req.Credential)
	if err != nil {
		util.Error(c, http.StatusUnauthorized, "Invalid Google token")
		return
	}

	// Verify audience matches our client ID
	if tokenInfo.Aud != config.AppConfig.GoogleClientID {
		util.Error(c, http.StatusUnauthorized, "Token audience mismatch")
		return
	}

	// Find or create user
	var user model.User
	result := h.DB.Where("google_id = ?", tokenInfo.Sub).First(&user)

	if result.Error != nil {
		// Check if email already exists (user registered with email first)
		emailResult := h.DB.Where("email = ?", tokenInfo.Email).First(&user)
		if emailResult.Error == nil {
			// Link Google ID to existing account
			h.DB.Model(&user).Updates(map[string]interface{}{
				"google_id": tokenInfo.Sub,
				"avatar":    tokenInfo.Picture,
			})
			if req.Phone != "" {
				h.DB.Model(&user).Update("phone", req.Phone)
			}
		} else {
			// Create new user
			user = model.User{
				Name:     tokenInfo.Name,
				Email:    tokenInfo.Email,
				GoogleID: &tokenInfo.Sub,
				Avatar:   tokenInfo.Picture,
				Phone:    req.Phone,
				Role:     "user",
			}
			if err := h.DB.Create(&user).Error; err != nil {
				util.Error(c, http.StatusInternalServerError, "Failed to create user")
				return
			}
			// Seed default data for new user
			service.SeedUserDefaults(h.DB, user.ID)
		}
	} else {
		// Update phone if provided
		if req.Phone != "" && user.Phone == "" {
			h.DB.Model(&user).Update("phone", req.Phone)
			user.Phone = req.Phone
		}
	}

	// Generate tokens
	accessToken, err := h.AuthService.GenerateAccessToken(user.ID)
	if err != nil {
		util.Error(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	refreshToken, err := h.AuthService.GenerateRefreshToken(user.ID)
	if err != nil {
		util.Error(c, http.StatusInternalServerError, "Failed to generate refresh token")
		return
	}

	isSecure := config.AppConfig.AppEnv == "production"
	c.SetCookie("refreshToken", refreshToken, 7*24*3600, "/", "", isSecure, true)

	util.Success(c, http.StatusOK, "Login successful", gin.H{
		"access_token": accessToken,
		"user":         user.ToResponse(),
	})
}

// verifyGoogleToken verifies a Google ID token using Google's tokeninfo API
func verifyGoogleToken(idToken string) (*googleTokenInfo, error) {
	resp, err := http.Get(fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", idToken))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid token: status %d", resp.StatusCode)
	}

	var info googleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}

	return &info, nil
}
