package handler

import (
	"net/http"
	"strconv"

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
