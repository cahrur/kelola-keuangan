package model

import "time"

type Category struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index;not null"`
	Name      string    `json:"name" gorm:"size:100;not null" binding:"required"`
	Type      string    `json:"type" gorm:"size:20;not null" binding:"required,oneof=income expense"`
	Icon      string    `json:"icon" gorm:"size:50"`
	Color     string    `json:"color" gorm:"size:20"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateCategoryRequest struct {
	Name  string `json:"name" binding:"required,min=1,max=100"`
	Type  string `json:"type" binding:"required,oneof=income expense"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}

type UpdateCategoryRequest struct {
	Name  string `json:"name" binding:"omitempty,min=1,max=100"`
	Type  string `json:"type" binding:"omitempty,oneof=income expense"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}
