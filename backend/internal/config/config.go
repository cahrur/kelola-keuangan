package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort            string
	AppEnv             string
	DBHost             string
	DBPort             string
	DBName             string
	DBUser             string
	DBPass             string
	JWTSecret          string
	JWTAccessExp       string
	JWTRefreshExp      string
	BcryptRounds       int
	CORSOrigins        []string
	GoogleClientID     string
	TurnstileSecretKey string
	AIBaseURL          string
	AIAPIKey           string
	AIModel            string
	EncryptionKey      string
	SMTPHost           string
	SMTPPort           string
	SMTPUser           string
	SMTPPass           string
	SMTPFrom           string
}

var AppConfig *Config

func Load() *Config {
	godotenv.Load()

	rounds, _ := strconv.Atoi(getEnv("BCRYPT_ROUNDS", "12"))

	origins := strings.Split(getEnv("CORS_ORIGINS", "http://localhost:5173"), ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}

	AppConfig = &Config{
		AppPort:            getEnv("APP_PORT", "8000"),
		AppEnv:             getEnv("APP_ENV", "development"),
		DBHost:             getEnv("DB_HOST", "localhost"),
		DBPort:             getEnv("DB_PORT", "5432"),
		DBName:             getEnv("DB_NAME", "catat_keuangan"),
		DBUser:             getEnv("DB_USER", "postgres"),
		DBPass:             getEnv("DB_PASS", ""),
		JWTSecret:          getEnv("JWT_SECRET", "change-me-in-production-min-32-chars"),
		JWTAccessExp:       getEnv("JWT_ACCESS_EXPIRY", "15m"),
		JWTRefreshExp:      getEnv("JWT_REFRESH_EXPIRY", "7d"),
		BcryptRounds:       rounds,
		CORSOrigins:        origins,
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		TurnstileSecretKey: getEnv("TURNSTILE_SECRET_KEY", ""),
		AIBaseURL:          getEnv("AI_BASE_URL", ""),
		AIAPIKey:           getEnv("AI_API_KEY", ""),
		AIModel:            getEnv("AI_MODEL", "gpt-4o-mini"),
		EncryptionKey:      getEnv("ENCRYPTION_KEY", ""),
		SMTPHost:           getEnv("SMTP_HOST", ""),
		SMTPPort:           getEnv("SMTP_PORT", "587"),
		SMTPUser:           getEnv("SMTP_USER", ""),
		SMTPPass:           getEnv("SMTP_PASS", ""),
		SMTPFrom:           getEnv("SMTP_FROM", ""),
	}

	return AppConfig
}

func (c *Config) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
		c.DBHost, c.DBPort, c.DBUser, c.DBPass, c.DBName,
	)
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
