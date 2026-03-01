package service

import (
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/smtp"
	"regexp"
	"time"

	"catat-keuangan-backend/internal/config"
	"catat-keuangan-backend/internal/model"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type PasswordResetService struct {
	DB *gorm.DB
}

func NewPasswordResetService(db *gorm.DB) *PasswordResetService {
	return &PasswordResetService{DB: db}
}

// generateOTP creates a cryptographically random 6-digit OTP
func generateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// RequestOTP generates OTP and sends via email
func (s *PasswordResetService) RequestOTP(email string) error {
	var user model.User
	if err := s.DB.Where("email = ?", email).First(&user).Error; err != nil {
		// Don't reveal if email exists or not (security)
		return nil
	}

	// Invalidate any existing unused OTPs for this user
	s.DB.Model(&model.PasswordResetOTP{}).
		Where("user_id = ? AND used = ?", user.ID, false).
		Update("used", true)

	otp, err := generateOTP()
	if err != nil {
		return errors.New("gagal membuat kode OTP")
	}

	record := model.PasswordResetOTP{
		UserID:    user.ID,
		OTP:       otp,
		ExpiresAt: time.Now().Add(5 * time.Minute),
		Used:      false,
	}

	if err := s.DB.Create(&record).Error; err != nil {
		return errors.New("gagal menyimpan OTP")
	}

	// Send OTP via email
	if err := s.sendEmailOTP(email, user.Name, otp); err != nil {
		log.Printf("Failed to send OTP email to %s: %v", email, err)
		return errors.New("gagal mengirim email OTP")
	}

	return nil
}

// VerifyOTP checks if OTP is valid and not expired
func (s *PasswordResetService) VerifyOTP(email, otp string) error {
	// Validate OTP format (6 digits only)
	if matched, _ := regexp.MatchString(`^\d{6}$`, otp); !matched {
		return errors.New("kode OTP tidak valid")
	}

	var user model.User
	if err := s.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return errors.New("kode OTP tidak valid")
	}

	var record model.PasswordResetOTP
	err := s.DB.Where("user_id = ? AND otp = ? AND used = ? AND expires_at > ?",
		user.ID, otp, false, time.Now()).
		Order("created_at DESC").
		First(&record).Error

	if err != nil {
		return errors.New("kode OTP tidak valid atau sudah kadaluarsa")
	}

	return nil
}

// ResetPassword verifies OTP and sets new password
func (s *PasswordResetService) ResetPassword(email, otp, newPassword string) error {
	// Validate OTP format (6 digits only)
	if matched, _ := regexp.MatchString(`^\d{6}$`, otp); !matched {
		return errors.New("kode OTP tidak valid")
	}

	var user model.User
	if err := s.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return errors.New("kode OTP tidak valid")
	}

	// Verify OTP
	var record model.PasswordResetOTP
	err := s.DB.Where("user_id = ? AND otp = ? AND used = ? AND expires_at > ?",
		user.ID, otp, false, time.Now()).
		Order("created_at DESC").
		First(&record).Error

	if err != nil {
		return errors.New("kode OTP tidak valid atau sudah kadaluarsa")
	}

	// Validate password policy (reuse existing function)
	if err := validatePassword(newPassword); err != nil {
		return err
	}

	// Hash new password
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), config.AppConfig.BcryptRounds)
	if err != nil {
		return errors.New("gagal memproses password baru")
	}

	// Update password
	if err := s.DB.Model(&user).Update("password_hash", string(hash)).Error; err != nil {
		return errors.New("gagal menyimpan password baru")
	}

	// Mark OTP as used
	s.DB.Model(&record).Update("used", true)

	// Revoke all refresh tokens (force re-login)
	s.DB.Where("user_id = ?", user.ID).Delete(&model.RefreshToken{})

	return nil
}

// sendEmailOTP sends OTP code via SMTP
func (s *PasswordResetService) sendEmailOTP(to, name, otp string) error {
	cfg := config.AppConfig
	if cfg.SMTPHost == "" || cfg.SMTPUser == "" {
		return errors.New("SMTP belum dikonfigurasi")
	}

	subject := "Reset Password - Kelola Keuangan"
	body := fmt.Sprintf(`Halo %s,

Kode OTP untuk reset password kamu adalah:

    %s

Kode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.

Jika kamu tidak meminta reset password, abaikan email ini.

Salam,
Kelola Keuangan — DealTech`, name, otp)

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		cfg.SMTPFrom, to, subject, body)

	auth := smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPHost)
	addr := fmt.Sprintf("%s:%s", cfg.SMTPHost, cfg.SMTPPort)

	return smtp.SendMail(addr, auth, cfg.SMTPFrom, []string{to}, []byte(msg))
}
