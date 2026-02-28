package handler

import (
	"net/http"

	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Health(c *gin.Context) {
	util.Success(c, http.StatusOK, "OK", gin.H{
		"status": "healthy",
	})
}
