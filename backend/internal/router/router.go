package router

import (
	"time"

	"catat-keuangan-backend/internal/config"
	"catat-keuangan-backend/internal/handler"
	"catat-keuangan-backend/internal/middleware"
	"catat-keuangan-backend/internal/service"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(db *gorm.DB) *gin.Engine {
	if config.AppConfig.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS from .env
	r.Use(cors.New(cors.Config{
		AllowOrigins:     config.AppConfig.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Rate limiting per security-standards Rule 1
	generalLimiter := middleware.NewRateLimiter(100, 15*time.Minute)
	authLimiter := middleware.NewRateLimiter(10, 15*time.Minute)

	// Apply general rate limit to all API routes
	r.Use(generalLimiter.Middleware())

	// Services
	authService := service.NewAuthService(db)

	// Handlers
	healthHandler := handler.NewHealthHandler()
	authHandler := handler.NewAuthHandler(authService)
	googleAuthHandler := handler.NewGoogleAuthHandler(db, authService)
	transactionHandler := handler.NewTransactionHandler(db)
	categoryHandler := handler.NewCategoryHandler(db)
	walletHandler := handler.NewWalletHandler(db)
	debtHandler := handler.NewDebtHandler(db)
	obligationHandler := handler.NewObligationHandler(db)
	budgetHandler := handler.NewBudgetHandler(db)
	aiHandler := handler.NewAIHandler(db)
	passwordResetService := service.NewPasswordResetService(db)
	passwordResetHandler := handler.NewPasswordResetHandler(passwordResetService)

	// Health check (no auth)
	r.GET("/health", healthHandler.Health)

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth (no auth required, stricter rate limit)
		auth := v1.Group("/auth")
		auth.Use(authLimiter.Middleware())
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/google", googleAuthHandler.GoogleLogin)
			auth.POST("/forgot-password", passwordResetHandler.ForgotPassword)
			auth.POST("/verify-otp", passwordResetHandler.VerifyOTP)
			auth.POST("/reset-password", passwordResetHandler.ResetPassword)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// Auth (requires auth)
			protected.POST("/auth/logout", authHandler.Logout)
			protected.GET("/auth/me", authHandler.Me)

			// Transactions
			protected.GET("/transactions", transactionHandler.List)
			protected.POST("/transactions", transactionHandler.Create)
			protected.PUT("/transactions/:id", transactionHandler.Update)
			protected.DELETE("/transactions/:id", transactionHandler.Delete)

			// Categories
			protected.GET("/categories", categoryHandler.List)
			protected.POST("/categories", categoryHandler.Create)
			protected.PUT("/categories/:id", categoryHandler.Update)
			protected.DELETE("/categories/:id", categoryHandler.Delete)

			// Wallets
			protected.GET("/wallets", walletHandler.List)
			protected.POST("/wallets", walletHandler.Create)
			protected.PUT("/wallets/:id", walletHandler.Update)
			protected.DELETE("/wallets/:id", walletHandler.Delete)

			// Debts
			protected.GET("/debts", debtHandler.List)
			protected.POST("/debts", debtHandler.Create)
			protected.PUT("/debts/:id", debtHandler.Update)
			protected.DELETE("/debts/:id", debtHandler.Delete)

			// Obligations
			protected.GET("/obligations", obligationHandler.List)
			protected.POST("/obligations", obligationHandler.Create)
			protected.PUT("/obligations/:id", obligationHandler.Update)
			protected.DELETE("/obligations/:id", obligationHandler.Delete)
			protected.GET("/obligations/:id/checklist", obligationHandler.ListChecklist)
			protected.POST("/obligations/:id/checklist", obligationHandler.TogglePeriod)

			// Budgets
			protected.GET("/budgets", budgetHandler.List)
			protected.POST("/budgets", budgetHandler.Set)
			protected.DELETE("/budgets/:id", budgetHandler.Delete)

			// AI
			protected.GET("/ai/sessions", aiHandler.ListSessions)
			protected.POST("/ai/sessions", aiHandler.CreateSession)
			protected.DELETE("/ai/sessions/:id", aiHandler.DeleteSession)
			protected.GET("/ai/sessions/:id/messages", aiHandler.GetMessages)
			protected.POST("/ai/chat", aiHandler.Chat)
			protected.GET("/ai/config", aiHandler.GetAIConfig)
			protected.PUT("/ai/config", aiHandler.UpdateAIConfig)
			protected.GET("/ai/insight", aiHandler.GetInsight)
			protected.POST("/ai/insight/refresh", aiHandler.RefreshInsight)
		}
	}

	// Serve frontend static files (single-container deployment)
	// Check if dist/ directory exists (production build)
	r.Static("/assets", "./dist/assets")
	r.StaticFile("/favicon.ico", "./dist/favicon.ico")
	r.StaticFile("/manifest.json", "./dist/manifest.json")
	r.StaticFile("/logo.png", "./dist/logo.png")

	// SPA fallback: serve index.html for all non-API, non-asset routes
	r.NoRoute(func(c *gin.Context) {
		// Don't serve index.html for API routes
		if len(c.Request.URL.Path) >= 4 && c.Request.URL.Path[:4] == "/api" {
			util.Error(c, 404, "Route not found")
			return
		}
		c.File("./dist/index.html")
	})

	return r
}
