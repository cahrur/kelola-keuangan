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
	if walletID := c.Query("wallet_id"); walletID != "" {
		query = query.Where("wallet_id = ?", walletID)
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
		WalletID:    req.WalletID,
		Date:        req.Date,
	}

	// Use DB transaction to ensure atomicity
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&txn).Error; err != nil {
			return err
		}

		// Auto-adjust wallet balance
		if txn.WalletID != nil {
			delta := txn.Amount
			if txn.Type == "expense" {
				delta = -delta
			}
			if err := tx.Model(&model.Wallet{}).Where("id = ? AND user_id = ?", *txn.WalletID, userID).
				Update("balance", gorm.Expr("balance + ?", delta)).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
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

	// Capture old values for wallet balance reversal
	oldType := txn.Type
	oldAmount := txn.Amount
	oldWalletID := txn.WalletID

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
	if req.WalletID != nil {
		updates["wallet_id"] = req.WalletID
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// Reverse old wallet balance
		if oldWalletID != nil {
			oldDelta := oldAmount
			if oldType == "expense" {
				oldDelta = -oldDelta
			}
			if err := tx.Model(&model.Wallet{}).Where("id = ? AND user_id = ?", *oldWalletID, userID).
				Update("balance", gorm.Expr("balance - ?", oldDelta)).Error; err != nil {
				return err
			}
		}

		// Apply updates
		if err := tx.Model(&txn).Updates(updates).Error; err != nil {
			return err
		}

		// Re-read for new values
		tx.First(&txn, txn.ID)

		// Apply new wallet balance
		if txn.WalletID != nil {
			newDelta := txn.Amount
			if txn.Type == "expense" {
				newDelta = -newDelta
			}
			if err := tx.Model(&model.Wallet{}).Where("id = ? AND user_id = ?", *txn.WalletID, userID).
				Update("balance", gorm.Expr("balance + ?", newDelta)).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		util.Error(c, http.StatusInternalServerError, "Failed to update transaction")
		return
	}

	util.Success(c, http.StatusOK, "Transaction updated", txn)
}

func (h *TransactionHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var txn model.Transaction
	if err := h.DB.Where("id = ? AND user_id = ?", id, userID).First(&txn).Error; err != nil {
		util.Error(c, http.StatusNotFound, "Transaction not found")
		return
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// Reverse wallet balance before deleting
		if txn.WalletID != nil {
			delta := txn.Amount
			if txn.Type == "expense" {
				delta = -delta
			}
			if err := tx.Model(&model.Wallet{}).Where("id = ? AND user_id = ?", *txn.WalletID, userID).
				Update("balance", gorm.Expr("balance - ?", delta)).Error; err != nil {
				return err
			}
		}

		if err := tx.Delete(&txn).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		util.Error(c, http.StatusInternalServerError, "Failed to delete transaction")
		return
	}

	util.Success(c, http.StatusOK, "Transaction deleted", nil)
}
