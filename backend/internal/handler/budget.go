package handler

import (
	"net/http"
	"strconv"

	"catat-keuangan-backend/internal/model"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type BudgetHandler struct {
	DB *gorm.DB
}

func NewBudgetHandler(db *gorm.DB) *BudgetHandler {
	return &BudgetHandler{DB: db}
}

func (h *BudgetHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")
	var budgets []model.Budget

	query := h.DB.Where("user_id = ?", userID)

	if month := c.Query("month"); month != "" {
		query = query.Where("month = ?", month)
	}
	if year := c.Query("year"); year != "" {
		query = query.Where("year = ?", year)
	}

	query.Find(&budgets)
	util.Success(c, http.StatusOK, "Budgets retrieved", budgets)
}

func (h *BudgetHandler) Set(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req model.SetBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	// Upsert: update if exists for same category+month+year, else create
	var existing model.Budget
	err := h.DB.Where(
		"user_id = ? AND category_id = ? AND month = ? AND year = ?",
		userID, req.CategoryID, req.Month, req.Year,
	).First(&existing).Error

	if err == nil {
		// Update existing
		h.DB.Model(&existing).Update("amount", req.Amount)
		util.Success(c, http.StatusOK, "Budget updated", existing)
		return
	}

	// Create new
	budget := model.Budget{
		UserID:     userID.(uint),
		CategoryID: req.CategoryID,
		Amount:     req.Amount,
		Month:      req.Month,
		Year:       req.Year,
	}

	if err := h.DB.Create(&budget).Error; err != nil {
		util.Error(c, http.StatusInternalServerError, "Failed to create budget")
		return
	}

	util.Success(c, http.StatusCreated, "Budget created", budget)
}

func (h *BudgetHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	result := h.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Budget{})
	if result.RowsAffected == 0 {
		util.Error(c, http.StatusNotFound, "Budget not found")
		return
	}

	util.Success(c, http.StatusOK, "Budget deleted", nil)
}
