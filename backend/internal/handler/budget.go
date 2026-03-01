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

	month := c.Query("month")
	year := c.Query("year")

	query := h.DB.Where("user_id = ?", userID)
	if month != "" {
		query = query.Where("month = ?", month)
	}
	if year != "" {
		query = query.Where("year = ?", year)
	}
	query.Find(&budgets)

	// Auto-carry recurring budgets (monthly/yearly) to the requested period
	if month != "" && year != "" {
		reqMonth, _ := strconv.Atoi(month)
		reqYear, _ := strconv.Atoi(year)

		existingCats := make(map[uint]bool)
		for _, b := range budgets {
			existingCats[b.CategoryID] = true
		}

		// Find monthly recurring budgets from any previous month
		var monthlyRecurring []model.Budget
		h.DB.Where(
			"user_id = ? AND period = ? AND (year < ? OR (year = ? AND month < ?))",
			userID, "monthly", reqYear, reqYear, reqMonth,
		).Find(&monthlyRecurring)

		// Find yearly recurring budgets from any previous year (only carry to January)
		var yearlyRecurring []model.Budget
		if reqMonth == 0 { // January = month 0
			h.DB.Where(
				"user_id = ? AND period = ? AND year < ?",
				userID, "yearly", reqYear,
			).Find(&yearlyRecurring)
		}

		// Merge both lists and pick latest per category
		allRecurring := append(monthlyRecurring, yearlyRecurring...)
		latestPerCat := make(map[uint]model.Budget)
		for _, r := range allRecurring {
			existing, found := latestPerCat[r.CategoryID]
			if !found || r.Year > existing.Year || (r.Year == existing.Year && r.Month > existing.Month) {
				latestPerCat[r.CategoryID] = r
			}
		}

		// Auto-create copies for missing categories
		var toCreate []model.Budget
		for catID, src := range latestPerCat {
			if existingCats[catID] {
				continue
			}
			toCreate = append(toCreate, model.Budget{
				UserID:     userID.(uint),
				CategoryID: catID,
				Amount:     src.Amount,
				Month:      reqMonth,
				Year:       reqYear,
				Period:     src.Period,
			})
		}

		if len(toCreate) > 0 {
			h.DB.Create(&toCreate)
			budgets = append(budgets, toCreate...)
		}
	}

	util.Success(c, http.StatusOK, "Budgets retrieved", budgets)
}

func (h *BudgetHandler) Set(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req model.SetBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	// Default period to "once" if not specified
	if req.Period == "" {
		req.Period = "once"
	}

	// Upsert: update if exists for same category+month+year, else create
	var existing model.Budget
	err := h.DB.Where(
		"user_id = ? AND category_id = ? AND month = ? AND year = ?",
		userID, req.CategoryID, req.Month, req.Year,
	).First(&existing).Error

	if err == nil {
		// Update existing — use map to ensure false/zero values are persisted
		h.DB.Model(&existing).Updates(map[string]interface{}{
			"amount": req.Amount,
			"period": req.Period,
		})
		existing.Amount = req.Amount
		existing.Period = req.Period
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
		Period:     req.Period,
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
