package main

import (
	"fmt"
	"log"

	"catat-keuangan-backend/internal/config"
	"catat-keuangan-backend/internal/model"
	"catat-keuangan-backend/internal/router"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load config from .env
	cfg := config.Load()

	// Connect to database
	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully")

	// Auto-migrate models (safe, idempotent)
	if err := db.AutoMigrate(
		&model.User{},
		&model.RefreshToken{},
		&model.Transaction{},
		&model.Category{},
		&model.Wallet{},
		&model.Debt{},
		&model.Obligation{},
		&model.ObligationChecklist{},
		&model.Budget{},
		&model.ChatSession{},
		&model.ChatMessage{},
		&model.UserAIConfig{},
	); err != nil {
		log.Fatal("Auto-migration failed:", err)
	}

	log.Println("Database migrations applied")

	// Setup router
	r := router.Setup(db)

	// Start server
	addr := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("Server starting on port %s\n", cfg.AppPort)

	if err := r.Run(addr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
