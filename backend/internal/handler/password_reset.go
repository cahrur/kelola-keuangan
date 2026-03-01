package handler

import (
	"net/http"

	"catat-keuangan-backend/internal/service"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
)

type PasswordResetHandler struct {
	Service *service.PasswordResetService
}

func NewPasswordResetHandler(service *service.PasswordResetService) *PasswordResetHandler {
	return &PasswordResetHandler{Service: service}
}

type forgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type verifyOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
	OTP   string `json:"otp" binding:"required,len=6"`
}

type resetPasswordRequest struct {
	Email    string `json:"email" binding:"required,email"`
	OTP      string `json:"otp" binding:"required,len=6"`
	Password string `json:"password" binding:"required,min=8"`
}

// ForgotPassword sends OTP to user's email
func (h *PasswordResetHandler) ForgotPassword(c *gin.Context) {
	var req forgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	// Fire and forget — always return success to prevent email enumeration
	// Errors (email not found, SMTP failure) are silently swallowed
	_ = h.Service.RequestOTP(req.Email)

	util.Success(c, http.StatusOK, "Jika email terdaftar, kode OTP telah dikirim", nil)
}

// VerifyOTP checks if the OTP is valid
func (h *PasswordResetHandler) VerifyOTP(c *gin.Context) {
	var req verifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	if err := h.Service.VerifyOTP(req.Email, req.OTP); err != nil {
		util.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	util.Success(c, http.StatusOK, "Kode OTP valid", nil)
}

// ResetPassword sets new password after OTP verification
func (h *PasswordResetHandler) ResetPassword(c *gin.Context) {
	var req resetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	if err := h.Service.ResetPassword(req.Email, req.OTP, req.Password); err != nil {
		util.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	util.Success(c, http.StatusOK, "Password berhasil direset. Silakan login dengan password baru.", nil)
}
