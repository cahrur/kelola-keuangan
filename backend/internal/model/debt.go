package model

import "time"

type Debt struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index;not null"`
	Type      string    `json:"type" gorm:"size:20;not null" binding:"required,oneof=i_owe they_owe"`
	Person    string    `json:"person" gorm:"size:200;not null" binding:"required"`
	Amount    float64   `json:"amount" gorm:"not null" binding:"required,gt=0"`
	PaidAmount float64  `json:"paid_amount" gorm:"default:0"`
	Note      string    `json:"note" gorm:"size:500"`
	Status    string    `json:"status" gorm:"size:20;default:active"`
	DueDate   string    `json:"due_date" gorm:"size:10"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateDebtRequest struct {
	Type    string  `json:"type" binding:"required,oneof=i_owe they_owe"`
	Person  string  `json:"person" binding:"required,min=1,max=200"`
	Amount  float64 `json:"amount" binding:"required,gt=0"`
	Note    string  `json:"note" binding:"omitempty,max=500"`
	DueDate string  `json:"due_date"`
}

type UpdateDebtRequest struct {
	Type       string   `json:"type" binding:"omitempty,oneof=i_owe they_owe"`
	Person     string   `json:"person" binding:"omitempty,min=1,max=200"`
	Amount     *float64 `json:"amount" binding:"omitempty,gt=0"`
	PaidAmount *float64 `json:"paid_amount" binding:"omitempty,gte=0"`
	Note       string   `json:"note" binding:"omitempty,max=500"`
	Status     string   `json:"status" binding:"omitempty,oneof=active settled"`
	DueDate    string   `json:"due_date"`
}
