package model

import "time"

type Wallet struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index;not null"`
	Name      string    `json:"name" gorm:"size:100;not null" binding:"required"`
	Icon      string    `json:"icon" gorm:"size:50"`
	Color     string    `json:"color" gorm:"size:20"`
	Balance   float64   `json:"balance" gorm:"default:0"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateWalletRequest struct {
	Name    string  `json:"name" binding:"required,min=1,max=100"`
	Icon    string  `json:"icon"`
	Color   string  `json:"color"`
	Balance float64 `json:"balance"`
}

type UpdateWalletRequest struct {
	Name    string   `json:"name" binding:"omitempty,min=1,max=100"`
	Icon    string   `json:"icon"`
	Color   string   `json:"color"`
	Balance *float64 `json:"balance"`
}
