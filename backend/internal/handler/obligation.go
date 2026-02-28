package handler

import (
	"net/http"
	"strconv"

	"catat-keuangan-backend/internal/model"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ObligationHandler struct {
	DB *gorm.DB
}

func NewObligationHandler(db *gorm.DB) *ObligationHandler {
	return &ObligationHandler{DB: db}
}

func (h *ObligationHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")
	var obligations []model.Obligation
	h.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&obligations)
	util.Success(c, http.StatusOK, "Obligations retrieved", obligations)
}

func (h *ObligationHandler) Create(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req model.CreateObligationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	obligation := model.Obligation{
		UserID:      userID.(uint),
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Amount:      req.Amount,
		AutoRecord:  req.AutoRecord,
	}

	if err := h.DB.Create(&obligation).Error; err != nil {
		util.Error(c, http.StatusInternalServerError, "Failed to create obligation")
		return
	}

	util.Success(c, http.StatusCreated, "Obligation created", obligation)
}

func (h *ObligationHandler) Update(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var obligation model.Obligation
	if err := h.DB.Where("id = ? AND user_id = ?", id, userID).First(&obligation).Error; err != nil {
		util.Error(c, http.StatusNotFound, "Obligation not found")
		return
	}

	var req model.UpdateObligationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.StartDate != "" {
		updates["start_date"] = req.StartDate
	}
	if req.EndDate != "" {
		updates["end_date"] = req.EndDate
	}
	if req.Amount != nil {
		updates["amount"] = *req.Amount
	}
	if req.AutoRecord != nil {
		updates["auto_record"] = *req.AutoRecord
	}

	h.DB.Model(&obligation).Updates(updates)
	util.Success(c, http.StatusOK, "Obligation updated", obligation)
}

func (h *ObligationHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	result := h.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Obligation{})
	if result.RowsAffected == 0 {
		util.Error(c, http.StatusNotFound, "Obligation not found")
		return
	}

	// Also delete related checklists
	h.DB.Where("obligation_id = ?", id).Delete(&model.ObligationChecklist{})

	util.Success(c, http.StatusOK, "Obligation deleted", nil)
}

// Checklist endpoints
func (h *ObligationHandler) ListChecklist(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	// Verify ownership
	var obligation model.Obligation
	if err := h.DB.Where("id = ? AND user_id = ?", id, userID).First(&obligation).Error; err != nil {
		util.Error(c, http.StatusNotFound, "Obligation not found")
		return
	}

	var checklist []model.ObligationChecklist
	h.DB.Where("obligation_id = ?", id).Order("period ASC").Find(&checklist)
	util.Success(c, http.StatusOK, "Checklist retrieved", checklist)
}

func (h *ObligationHandler) TogglePeriod(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	// Verify ownership
	var obligation model.Obligation
	if err := h.DB.Where("id = ? AND user_id = ?", id, userID).First(&obligation).Error; err != nil {
		util.Error(c, http.StatusNotFound, "Obligation not found")
		return
	}

	var req struct {
		Period string `json:"period" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	// Toggle: if exists, delete; if not, create
	var existing model.ObligationChecklist
	if err := h.DB.Where("obligation_id = ? AND period = ?", id, req.Period).First(&existing).Error; err == nil {
		h.DB.Delete(&existing)
		util.Success(c, http.StatusOK, "Period unchecked", nil)
		return
	}

	item := model.ObligationChecklist{
		ObligationID: uint(id),
		Period:       req.Period,
	}
	h.DB.Create(&item)
	util.Success(c, http.StatusCreated, "Period checked", item)
}
