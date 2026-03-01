package handler

import (
	"net/http"
	"sort"
	"strconv"
	"time"

	"catat-keuangan-backend/internal/model"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WalletHandler struct {
	DB *gorm.DB
}

func NewWalletHandler(db *gorm.DB) *WalletHandler {
	return &WalletHandler{DB: db}
}

func (h *WalletHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")
	var wallets []model.Wallet
	h.DB.Where("user_id = ?", userID).Order("created_at ASC").Find(&wallets)
	util.Success(c, http.StatusOK, "Wallets retrieved", wallets)
}

func (h *WalletHandler) Create(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req model.CreateWalletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	wallet := model.Wallet{
		UserID:  userID.(uint),
		Name:    req.Name,
		Icon:    req.Icon,
		Color:   req.Color,
		Balance: req.Balance,
	}

	if err := h.DB.Create(&wallet).Error; err != nil {
		util.Error(c, http.StatusInternalServerError, "Failed to create wallet")
		return
	}

	util.Success(c, http.StatusCreated, "Wallet created", wallet)
}

func (h *WalletHandler) Update(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var wallet model.Wallet
	if err := h.DB.Where("id = ? AND user_id = ?", id, userID).First(&wallet).Error; err != nil {
		util.Error(c, http.StatusNotFound, "Wallet not found")
		return
	}

	var req model.UpdateWalletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Icon != "" {
		updates["icon"] = req.Icon
	}
	if req.Color != "" {
		updates["color"] = req.Color
	}
	if req.Balance != nil {
		updates["balance"] = *req.Balance
	}

	h.DB.Model(&wallet).Updates(updates)
	util.Success(c, http.StatusOK, "Wallet updated", wallet)
}

func (h *WalletHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	result := h.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Wallet{})
	if result.RowsAffected == 0 {
		util.Error(c, http.StatusNotFound, "Wallet not found")
		return
	}

	util.Success(c, http.StatusOK, "Wallet deleted", nil)
}

func (h *WalletHandler) Transfer(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req model.CreateTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	if req.FromWalletID == req.ToWalletID {
		util.Error(c, http.StatusBadRequest, "Kantong asal dan tujuan tidak boleh sama")
		return
	}

	// Verify both wallets belong to user
	var fromWallet, toWallet model.Wallet
	if err := h.DB.Where("id = ? AND user_id = ?", req.FromWalletID, userID).First(&fromWallet).Error; err != nil {
		util.Error(c, http.StatusNotFound, "Kantong asal tidak ditemukan")
		return
	}
	if err := h.DB.Where("id = ? AND user_id = ?", req.ToWalletID, userID).First(&toWallet).Error; err != nil {
		util.Error(c, http.StatusNotFound, "Kantong tujuan tidak ditemukan")
		return
	}

	transfer := model.WalletTransfer{
		UserID:       userID.(uint),
		FromWalletID: req.FromWalletID,
		ToWalletID:   req.ToWalletID,
		Amount:       req.Amount,
		Description:  req.Description,
		Date:         time.Now().Format("2006-01-02"),
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&transfer).Error; err != nil {
			return err
		}
		// Deduct from source
		if err := tx.Model(&model.Wallet{}).Where("id = ?", req.FromWalletID).
			Update("balance", gorm.Expr("balance - ?", req.Amount)).Error; err != nil {
			return err
		}
		// Add to destination
		if err := tx.Model(&model.Wallet{}).Where("id = ?", req.ToWalletID).
			Update("balance", gorm.Expr("balance + ?", req.Amount)).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		util.Error(c, http.StatusInternalServerError, "Gagal transfer")
		return
	}

	// Re-read wallets for response
	h.DB.First(&fromWallet, fromWallet.ID)
	h.DB.First(&toWallet, toWallet.ID)

	util.Success(c, http.StatusCreated, "Transfer berhasil", gin.H{
		"transfer":    transfer,
		"from_wallet": fromWallet,
		"to_wallet":   toWallet,
	})
}

func (h *WalletHandler) Mutations(c *gin.Context) {
	userID, _ := c.Get("userID")
	walletID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	// Verify wallet belongs to user
	var wallet model.Wallet
	if err := h.DB.Where("id = ? AND user_id = ?", walletID, userID).First(&wallet).Error; err != nil {
		util.Error(c, http.StatusNotFound, "Wallet not found")
		return
	}

	var mutations []model.MutationItem

	// Get transactions for this wallet
	var transactions []model.Transaction
	h.DB.Where("wallet_id = ? AND user_id = ?", walletID, userID).
		Order("date DESC, created_at DESC").Find(&transactions)

	for _, t := range transactions {
		catID := t.CategoryID
		mutations = append(mutations, model.MutationItem{
			ID:          t.ID,
			Type:        t.Type,
			Amount:      t.Amount,
			Description: t.Description,
			Date:        t.Date,
			CreatedAt:   t.CreatedAt,
			CategoryID:  &catID,
		})
	}

	// Get transfers involving this wallet
	var transfers []model.WalletTransfer
	h.DB.Where("(from_wallet_id = ? OR to_wallet_id = ?) AND user_id = ?", walletID, walletID, userID).
		Order("date DESC, created_at DESC").Find(&transfers)

	// Batch-load all user wallets to avoid N+1 queries (Coding Standards Rule 9.2)
	var allWallets []model.Wallet
	h.DB.Where("user_id = ?", userID).Find(&allWallets)
	walletMap := make(map[uint]string)
	for _, w := range allWallets {
		walletMap[w.ID] = w.Name
	}

	for _, tr := range transfers {
		mutType := "transfer_in"
		var otherWalletID uint
		if tr.FromWalletID == uint(walletID) {
			mutType = "transfer_out"
			otherWalletID = tr.ToWalletID
		} else {
			otherWalletID = tr.FromWalletID
		}

		otherWalletName := walletMap[otherWalletID]

		desc := tr.Description
		if desc == "" {
			if mutType == "transfer_out" {
				desc = "Transfer ke " + otherWalletName
			} else {
				desc = "Transfer dari " + otherWalletName
			}
		}

		mutations = append(mutations, model.MutationItem{
			ID:          tr.ID,
			Type:        mutType,
			Amount:      tr.Amount,
			Description: desc,
			Date:        tr.Date,
			CreatedAt:   tr.CreatedAt,
			WalletName:  otherWalletName,
		})
	}

	// Sort by date DESC, then created_at DESC
	sort.Slice(mutations, func(i, j int) bool {
		if mutations[i].Date != mutations[j].Date {
			return mutations[i].Date > mutations[j].Date
		}
		return mutations[i].CreatedAt.After(mutations[j].CreatedAt)
	})

	util.Success(c, http.StatusOK, "Mutations retrieved", mutations)
}
