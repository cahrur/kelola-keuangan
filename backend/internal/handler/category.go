package handler

import (
	"net/http"
	"strconv"

	"catat-keuangan-backend/internal/model"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CategoryHandler struct {
	DB *gorm.DB
}

func NewCategoryHandler(db *gorm.DB) *CategoryHandler {
	return &CategoryHandler{DB: db}
}

func (h *CategoryHandler) List(c *gin.Context) {
	userID, _ := c.Get("userID")
	var categories []model.Category
	h.DB.Where("user_id = ?", userID).Order("created_at ASC").Find(&categories)
	util.Success(c, http.StatusOK, "Categories retrieved", categories)
}

func (h *CategoryHandler) Create(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req model.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	cat := model.Category{
		UserID: userID.(uint),
		Name:   req.Name,
		Type:   req.Type,
		Icon:   req.Icon,
		Color:  req.Color,
	}

	if err := h.DB.Create(&cat).Error; err != nil {
		util.Error(c, http.StatusInternalServerError, "Failed to create category")
		return
	}

	util.Success(c, http.StatusCreated, "Category created", cat)
}

func (h *CategoryHandler) Update(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var cat model.Category
	if err := h.DB.Where("id = ? AND user_id = ?", id, userID).First(&cat).Error; err != nil {
		util.Error(c, http.StatusNotFound, "Category not found")
		return
	}

	var req model.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", err.Error())
		return
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Icon != "" {
		updates["icon"] = req.Icon
	}
	if req.Color != "" {
		updates["color"] = req.Color
	}

	h.DB.Model(&cat).Updates(updates)
	util.Success(c, http.StatusOK, "Category updated", cat)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	result := h.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Category{})
	if result.RowsAffected == 0 {
		util.Error(c, http.StatusNotFound, "Category not found")
		return
	}

	util.Success(c, http.StatusOK, "Category deleted", nil)
}
