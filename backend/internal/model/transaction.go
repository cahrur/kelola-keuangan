package model

import "time"

type Transaction struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id" gorm:"index;not null"`
	Type        string    `json:"type" gorm:"size:20;not null" binding:"required,oneof=income expense"`
	Amount      float64   `json:"amount" gorm:"not null" binding:"required,gt=0"`
	Description string    `json:"description" gorm:"size:500;not null" binding:"required"`
	CategoryID  uint      `json:"category_id" binding:"required"`
	Date        string    `json:"date" gorm:"size:10;not null" binding:"required"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateTransactionRequest struct {
	Type        string  `json:"type" binding:"required,oneof=income expense"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Description string  `json:"description" binding:"required,min=1,max=500"`
	CategoryID  uint    `json:"category_id" binding:"required"`
	Date        string  `json:"date" binding:"required"`
}

type UpdateTransactionRequest struct {
	Type        string  `json:"type" binding:"omitempty,oneof=income expense"`
	Amount      float64 `json:"amount" binding:"omitempty,gt=0"`
	Description string  `json:"description" binding:"omitempty,min=1,max=500"`
	CategoryID  uint    `json:"category_id" binding:"omitempty"`
	Date        string  `json:"date" binding:"omitempty"`
}
