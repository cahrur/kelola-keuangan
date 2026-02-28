package handler

import (
	"net/http"
	"strconv"

	"catat-keuangan-backend/internal/model"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TransactionHandler struct {
	DB *gorm.DB
}

func NewTransactionHandler(db *gorm.DB) *TransactionHandler {
	return &TransactionHandler{DB: db}
}

func (h *TransactionHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")

	var transactions []model.Transaction
	query := h.DB.Where("user_id = ?", userID).Order("date DESC, created_at DESC")

	// Optional filters
	if t := c.Query("type"); t != "" {
		query = query.Where("type = ?", t)
	}
	if catID := c.Query("category_id"); catID != "" {
		query = query.Where("category_id = ?", catID)
	}
	if from := c.Query("date_from"); from != "" {
		query = query.Where("date >= ?", from)
	}
	if to := c.Query("date_to"); to != "" {
		query = query.Where("date <= ?", to)
	}

	query.Find(&transactions)
	util.Success(c, http.StatusOK, "Transactions retrieved", transactions)
}

func (h *TransactionHandler) Create(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req model.CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	txn := model.Transaction{
		UserID:      userID.(uint),
		Type:        req.Type,
		Amount:      req.Amount,
		Description: req.Description,
		CategoryID:  req.CategoryID,
		Date:        req.Date,
	}

	if err := h.DB.Create(&txn).Error; err != nil {
		util.Error(c, http.StatusInternalServerError, "Failed to create transaction")
		return
	}

	util.Success(c, http.StatusCreated, "Transaction created", txn)
}

func (h *TransactionHandler) Update(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var txn model.Transaction
	if err := h.DB.Where("id = ? AND user_id = ?", id, userID).First(&txn).Error; err != nil {
		util.Error(c, http.StatusNotFound, "Transaction not found")
		return
	}

	var req model.UpdateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	// Whitelist fields to prevent mass assignment
	updates := map[string]interface{}{}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Amount > 0 {
		updates["amount"] = req.Amount
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.CategoryID > 0 {
		updates["category_id"] = req.CategoryID
	}
	if req.Date != "" {
		updates["date"] = req.Date
	}

	h.DB.Model(&txn).Updates(updates)
	util.Success(c, http.StatusOK, "Transaction updated", txn)
}

func (h *TransactionHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	result := h.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Transaction{})
	if result.RowsAffected == 0 {
		util.Error(c, http.StatusNotFound, "Transaction not found")
		return
	}

	util.Success(c, http.StatusOK, "Transaction deleted", nil)
}
