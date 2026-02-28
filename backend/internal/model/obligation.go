package model

import "time"

type Obligation struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id" gorm:"index;not null"`
	Name        string    `json:"name" gorm:"size:200;not null" binding:"required"`
	Description string    `json:"description" gorm:"size:500"`
	Type        string    `json:"type" gorm:"size:20;not null" binding:"required,oneof=monthly yearly"`
	StartDate   string    `json:"start_date" gorm:"size:10;not null" binding:"required"`
	EndDate     string    `json:"end_date" gorm:"size:10"`
	Amount      float64   `json:"amount" gorm:"not null" binding:"required,gt=0"`
	AutoRecord  bool      `json:"auto_record" gorm:"default:false"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ObligationChecklist struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	ObligationID uint      `json:"obligation_id" gorm:"index;not null"`
	Period       string    `json:"period" gorm:"size:10;not null"`
	PaidAt       time.Time `json:"paid_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type CreateObligationRequest struct {
	Name        string  `json:"name" binding:"required,min=1,max=200"`
	Description string  `json:"description" binding:"omitempty,max=500"`
	Type        string  `json:"type" binding:"required,oneof=monthly yearly"`
	StartDate   string  `json:"start_date" binding:"required"`
	EndDate     string  `json:"end_date"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	AutoRecord  bool    `json:"auto_record"`
}

type UpdateObligationRequest struct {
	Name        string   `json:"name" binding:"omitempty,min=1,max=200"`
	Description string   `json:"description" binding:"omitempty,max=500"`
	Type        string   `json:"type" binding:"omitempty,oneof=monthly yearly"`
	StartDate   string   `json:"start_date"`
	EndDate     string   `json:"end_date"`
	Amount      *float64 `json:"amount" binding:"omitempty,gt=0"`
	AutoRecord  *bool    `json:"auto_record"`
}
