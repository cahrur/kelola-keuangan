package router

import (
	"catat-keuangan-backend/internal/config"
	"catat-keuangan-backend/internal/handler"
	"catat-keuangan-backend/internal/middleware"
	"catat-keuangan-backend/internal/service"

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

	// Services
	authService := service.NewAuthService(db)

	// Handlers
	healthHandler := handler.NewHealthHandler()
	authHandler := handler.NewAuthHandler(authService)
	transactionHandler := handler.NewTransactionHandler(db)
	categoryHandler := handler.NewCategoryHandler(db)
	walletHandler := handler.NewWalletHandler(db)
	debtHandler := handler.NewDebtHandler(db)
	obligationHandler := handler.NewObligationHandler(db)

	// Health check (no auth)
	r.GET("/health", healthHandler.Health)

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth (no auth required)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
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
		}
	}

	return r
}
