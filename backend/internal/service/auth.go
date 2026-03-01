package service

import (
	"errors"
	"strings"
	"time"
	"unicode"

	"catat-keuangan-backend/internal/config"
	"catat-keuangan-backend/internal/model"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	DB *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{DB: db}
}

// validatePassword enforces password policy per auth-standards Rule 6
func validatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("password minimal 8 karakter")
	}
	var hasUpper, hasLower, hasDigit bool
	for _, c := range password {
		if unicode.IsUpper(c) {
			hasUpper = true
		}
		if unicode.IsLower(c) {
			hasLower = true
		}
		if unicode.IsDigit(c) {
			hasDigit = true
		}
	}
	var missing []string
	if !hasUpper {
		missing = append(missing, "huruf besar")
	}
	if !hasLower {
		missing = append(missing, "huruf kecil")
	}
	if !hasDigit {
		missing = append(missing, "angka")
	}
	if len(missing) > 0 {
		return errors.New("password harus mengandung " + strings.Join(missing, ", "))
	}
	return nil
}

func (s *AuthService) Register(name, email, phone, password string) (*model.User, error) {
	// Check if email already exists
	var existing model.User
	if err := s.DB.Where("email = ?", email).First(&existing).Error; err == nil {
		return nil, errors.New("email already registered")
	}

	// Validate password policy per auth-standards Rule 6
	if err := validatePassword(password); err != nil {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), config.AppConfig.BcryptRounds)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := model.User{
		Name:         name,
		Email:        email,
		Phone:        phone,
		PasswordHash: string(hash),
		Role:         "user",
	}

	if err := s.DB.Create(&user).Error; err != nil {
		return nil, errors.New("failed to create user")
	}

	// Seed default categories and wallets for the new user
	SeedUserDefaults(s.DB, user.ID)

	return &user, nil
}

func (s *AuthService) Login(email, password string) (*model.User, error) {
	var user model.User
	if err := s.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	return &user, nil
}

func (s *AuthService) GenerateAccessToken(userID uint) (string, error) {
	expDuration := parseDuration(config.AppConfig.JWTAccessExp, 15*time.Minute)
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(expDuration).Unix(),
		"iat": time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}

func (s *AuthService) GenerateRefreshToken(userID uint) (string, error) {
	expDuration := parseDuration(config.AppConfig.JWTRefreshExp, 7*24*time.Hour)
	claims := jwt.MapClaims{
		"sub":  userID,
		"type": "refresh",
		"exp":  time.Now().Add(expDuration).Unix(),
		"iat":  time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		return "", err
	}

	// Store refresh token in DB for rotation/revocation
	rt := model.RefreshToken{
		UserID:    userID,
		Token:     tokenString,
		ExpiresAt: time.Now().Add(expDuration),
	}
	s.DB.Create(&rt)

	return tokenString, nil
}

func (s *AuthService) RefreshAccessToken(refreshTokenStr string) (string, string, error) {
	secret := []byte(config.AppConfig.JWTSecret)

	token, err := jwt.Parse(refreshTokenStr, func(t *jwt.Token) (interface{}, error) {
		return secret, nil
	})
	if err != nil || !token.Valid {
		return "", "", errors.New("invalid refresh token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", "", errors.New("invalid token claims")
	}

	tokenType, _ := claims["type"].(string)
	if tokenType != "refresh" {
		return "", "", errors.New("not a refresh token")
	}

	// Check if token exists in DB (not revoked)
	var stored model.RefreshToken
	if err := s.DB.Where("token = ?", refreshTokenStr).First(&stored).Error; err != nil {
		return "", "", errors.New("token revoked or expired")
	}

	// Revoke old token (rotation)
	s.DB.Delete(&stored)

	userID := uint(claims["sub"].(float64))

	// Issue new pair
	accessToken, err := s.GenerateAccessToken(userID)
	if err != nil {
		return "", "", err
	}

	newRefreshToken, err := s.GenerateRefreshToken(userID)
	if err != nil {
		return "", "", err
	}

	return accessToken, newRefreshToken, nil
}

func (s *AuthService) RevokeAllTokens(userID uint) {
	s.DB.Where("user_id = ?", userID).Delete(&model.RefreshToken{})
}

// parseDuration parses "15m", "1h", "7d" style durations
func parseDuration(val string, fallback time.Duration) time.Duration {
	if len(val) == 0 {
		return fallback
	}

	unit := val[len(val)-1]
	numStr := val[:len(val)-1]
	var num int
	for _, c := range numStr {
		if c >= '0' && c <= '9' {
			num = num*10 + int(c-'0')
		}
	}
	if num == 0 {
		return fallback
	}

	switch unit {
	case 's':
		return time.Duration(num) * time.Second
	case 'm':
		return time.Duration(num) * time.Minute
	case 'h':
		return time.Duration(num) * time.Hour
	case 'd':
		return time.Duration(num) * 24 * time.Hour
	default:
		return fallback
	}
}
