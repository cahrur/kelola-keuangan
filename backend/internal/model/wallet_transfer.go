package model

import "time"

type WalletTransfer struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	UserID       uint      `json:"user_id" gorm:"index;not null"`
	FromWalletID uint      `json:"from_wallet_id" gorm:"not null"`
	ToWalletID   uint      `json:"to_wallet_id" gorm:"not null"`
	Amount       float64   `json:"amount" gorm:"not null"`
	Description  string    `json:"description" gorm:"size:500"`
	Date         string    `json:"date" gorm:"size:10;not null"`
	CreatedAt    time.Time `json:"created_at"`
}

type CreateTransferRequest struct {
	FromWalletID uint    `json:"from_wallet_id" binding:"required"`
	ToWalletID   uint    `json:"to_wallet_id" binding:"required"`
	Amount       float64 `json:"amount" binding:"required,gt=0"`
	Description  string  `json:"description" binding:"max=500"`
}

// MutationItem is a unified view for both transactions and transfers
type MutationItem struct {
	ID          uint      `json:"id"`
	Type        string    `json:"type"` // "income", "expense", "transfer_in", "transfer_out"
	Amount      float64   `json:"amount"`
	Description string    `json:"description"`
	Date        string    `json:"date"`
	CreatedAt   time.Time `json:"created_at"`
	CategoryID  *uint     `json:"category_id,omitempty"`
	WalletName  string    `json:"wallet_name,omitempty"` // for transfers: the other wallet
}
