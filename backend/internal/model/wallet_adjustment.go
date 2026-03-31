package model

import "time"

type WalletAdjustment struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id" gorm:"index;not null"`
	WalletID    uint      `json:"wallet_id" gorm:"index;not null"`
	Type        string    `json:"type" gorm:"size:20;not null"` // add, subtract
	Amount      float64   `json:"amount" gorm:"not null"`
	Description string    `json:"description" gorm:"size:500"`
	Date        string    `json:"date" gorm:"size:10;not null"`
	CreatedAt   time.Time `json:"created_at"`
}

type AdjustWalletBalanceRequest struct {
	Type        string  `json:"type" binding:"required,oneof=add subtract"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Description string  `json:"description" binding:"max=500"`
}
