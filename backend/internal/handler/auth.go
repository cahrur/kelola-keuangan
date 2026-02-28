package handler

import (
	"net/http"

	"catat-keuangan-backend/internal/service"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	AuthService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{AuthService: authService}
}

type registerRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	user, err := h.AuthService.Register(req.Name, req.Email, req.Password)
	if err != nil {
		util.Error(c, http.StatusConflict, err.Error())
		return
	}

	util.Success(c, http.StatusCreated, "User registered successfully", user.ToResponse())
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	user, err := h.AuthService.Login(req.Email, req.Password)
	if err != nil {
		util.Error(c, http.StatusUnauthorized, err.Error())
		return
	}

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

	// Set refresh token as httpOnly cookie
	c.SetCookie("refreshToken", refreshToken, 7*24*3600, "/", "", false, true)

	util.Success(c, http.StatusOK, "Login successful", gin.H{
		"access_token": accessToken,
		"user":         user.ToResponse(),
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	refreshToken, err := c.Cookie("refreshToken")
	if err != nil {
		util.Error(c, http.StatusUnauthorized, "Refresh token not found")
		return
	}

	accessToken, newRefreshToken, err := h.AuthService.RefreshAccessToken(refreshToken)
	if err != nil {
		util.Error(c, http.StatusUnauthorized, err.Error())
		return
	}

	c.SetCookie("refreshToken", newRefreshToken, 7*24*3600, "/", "", false, true)

	util.Success(c, http.StatusOK, "Token refreshed", gin.H{
		"access_token": accessToken,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	userID, _ := c.Get("userID")
	h.AuthService.RevokeAllTokens(userID.(uint))

	c.SetCookie("refreshToken", "", -1, "/", "", false, true)

	util.Success(c, http.StatusOK, "Logged out successfully", nil)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("userID")
	var user struct {
		ID    uint   `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
		Role  string `json:"role"`
	}
	h.AuthService.DB.Table("users").Select("id, name, email, role").Where("id = ?", userID).Scan(&user)
	util.Success(c, http.StatusOK, "User profile", user)
}
