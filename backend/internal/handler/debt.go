package handler

import (
	"net/http"
	"strconv"

	"catat-keuangan-backend/internal/model"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DebtHandler struct {
	DB *gorm.DB
}

func NewDebtHandler(db *gorm.DB) *DebtHandler {
	return &DebtHandler{DB: db}
}

func (h *DebtHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")
	var debts []model.Debt
	query := h.DB.Where("user_id = ?", userID).Order("created_at DESC")

	if t := c.Query("type"); t != "" {
		query = query.Where("type = ?", t)
	}
	if s := c.Query("status"); s != "" {
		query = query.Where("status = ?", s)
	}

	query.Find(&debts)
	util.Success(c, http.StatusOK, "Debts retrieved", debts)
}

func (h *DebtHandler) Create(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req model.CreateDebtRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	debt := model.Debt{
		UserID:  userID.(uint),
		Type:    req.Type,
		Person:  req.Person,
		Amount:  req.Amount,
		Note:    req.Note,
		Status:  "active",
		DueDate: req.DueDate,
	}

	if err := h.DB.Create(&debt).Error; err != nil {
		util.Error(c, http.StatusInternalServerError, "Failed to create debt")
		return
	}

	util.Success(c, http.StatusCreated, "Debt created", debt)
}

func (h *DebtHandler) Update(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var debt model.Debt
	if err := h.DB.Where("id = ? AND user_id = ?", id, userID).First(&debt).Error; err != nil {
		util.Error(c, http.StatusNotFound, "Debt not found")
		return
	}

	var req model.UpdateDebtRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	updates := map[string]interface{}{}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Person != "" {
		updates["person"] = req.Person
	}
	if req.Amount != nil {
		updates["amount"] = *req.Amount
	}
	if req.PaidAmount != nil {
		updates["paid_amount"] = *req.PaidAmount
	}
	if req.Note != "" {
		updates["note"] = req.Note
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.DueDate != "" {
		updates["due_date"] = req.DueDate
	}

	h.DB.Model(&debt).Updates(updates)
	util.Success(c, http.StatusOK, "Debt updated", debt)
}

func (h *DebtHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	result := h.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Debt{})
	if result.RowsAffected == 0 {
		util.Error(c, http.StatusNotFound, "Debt not found")
		return
	}

	util.Success(c, http.StatusOK, "Debt deleted", nil)
}
