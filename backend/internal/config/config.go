package config

import (
	"fmt"
	"os"
	"slices"
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

// capacitorOrigin is the origin the Android build serves the web app from.
// It is fixed by the native shell and is always allowed through CORS, so the
// app keeps working even if CORS_ORIGINS is set without it.
const capacitorOrigin = "https://localhost"

var AppConfig *Config

func Load() *Config {
	godotenv.Load()

	rounds, _ := strconv.Atoi(getEnv("BCRYPT_ROUNDS", "12"))

	origins := strings.Split(getEnv("CORS_ORIGINS", "http://localhost:5173"), ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}
	if !slices.Contains(origins, capacitorOrigin) {
		origins = append(origins, capacitorOrigin)
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

// DSN builds a libpq keyword/value connection string.
//
// Every value is single-quoted. libpq and pgx skip the whitespace after "="
// before reading a value, so an unquoted empty password swallows the next
// keyword: "password= dbname=app" parses the password as "dbname=app" and
// leaves dbname unset, which silently connects to the database named after the
// user instead of the configured one. Quoting also keeps passwords containing
// spaces or quotes intact.
func (c *Config) DSN() string {
	return fmt.Sprintf(
		// TimeZone is a server runtime parameter: pgx forwards its value verbatim,
		// so it must stay unquoted. It is a constant and ends the string, so it can
		// neither be swallowed nor swallow anything.
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
		quoteDSNValue(c.DBHost),
		quoteDSNValue(c.DBPort),
		quoteDSNValue(c.DBUser),
		quoteDSNValue(c.DBPass),
		quoteDSNValue(c.DBName),
	)
}

// quoteDSNValue wraps a connection-string value in the single quotes libpq uses
// for values, escaping the backslash and quote it treats specially inside them.
func quoteDSNValue(value string) string {
	replacer := strings.NewReplacer(`\`, `\\`, `'`, `\'`)
	return "'" + replacer.Replace(value) + "'"
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
