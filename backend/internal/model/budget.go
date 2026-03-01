package model

import "time"

type Budget struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     uint      `json:"user_id" gorm:"index;not null"`
	CategoryID uint      `json:"category_id" gorm:"not null" binding:"required"`
	Amount     float64   `json:"amount" gorm:"not null" binding:"required,gt=0"`
	Month      int       `json:"month" gorm:"not null" binding:"min=0,max=11"`
	Year       int       `json:"year" gorm:"not null" binding:"required,min=2020"`
	Period     string    `json:"period" gorm:"size:10;default:'once'"` // once, monthly, yearly
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type SetBudgetRequest struct {
	CategoryID uint    `json:"category_id" binding:"required"`
	Amount     float64 `json:"amount" binding:"required,gt=0"`
	Month      int     `json:"month" binding:"min=0,max=11"`
	Year       int     `json:"year" binding:"required,min=2020"`
	Period     string  `json:"period" binding:"omitempty,oneof=once monthly yearly"`
}
