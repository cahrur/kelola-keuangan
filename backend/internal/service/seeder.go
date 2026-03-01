package service

import (
	"log"

	"catat-keuangan-backend/internal/model"

	"gorm.io/gorm"
)

// DefaultCategories are seeded for each new user upon registration
var DefaultCategories = []struct {
	Name  string
	Type  string
	Icon  string
	Color string
}{
	// Income
	{Name: "Gaji", Type: "income", Icon: "Briefcase", Color: "#22c55e"},
	{Name: "Freelance", Type: "income", Icon: "Laptop", Color: "#00cec9"},
	{Name: "Investasi", Type: "income", Icon: "TrendingUp", Color: "#0984e3"},
	{Name: "Lainnya", Type: "income", Icon: "Plus", Color: "#3b987b"},
	// Expense
	{Name: "Makanan", Type: "expense", Icon: "UtensilsCrossed", Color: "#98503b"},
	{Name: "Transportasi", Type: "expense", Icon: "Car", Color: "#fdcb6e"},
	{Name: "Belanja", Type: "expense", Icon: "ShoppingBag", Color: "#e84393"},
	{Name: "Tagihan", Type: "expense", Icon: "Receipt", Color: "#d63031"},
	{Name: "Hiburan", Type: "expense", Icon: "Gamepad2", Color: "#a29bfe"},
	{Name: "Kesehatan", Type: "expense", Icon: "Heart", Color: "#ff7675"},
	{Name: "Pendidikan", Type: "expense", Icon: "GraduationCap", Color: "#74b9ff"},
	{Name: "Lainnya", Type: "expense", Icon: "MoreHorizontal", Color: "#636e72"},
}

// DefaultWallets are seeded for each new user upon registration
var DefaultWallets = []struct {
	Name  string
	Icon  string
	Color string
}{
	{Name: "Dompet", Icon: "Wallet", Color: "#3b987b"},
	{Name: "Bank", Icon: "Building", Color: "#0984e3"},
	{Name: "E-Wallet", Icon: "Smartphone", Color: "#22c55e"},
}

// SeedUserDefaults creates default categories and wallets for a new user
func SeedUserDefaults(db *gorm.DB, userID uint) {
	// Seed categories
	for _, cat := range DefaultCategories {
		db.Create(&model.Category{
			UserID: userID,
			Name:   cat.Name,
			Type:   cat.Type,
			Icon:   cat.Icon,
			Color:  cat.Color,
		})
	}

	// Seed wallets
	for _, w := range DefaultWallets {
		db.Create(&model.Wallet{
			UserID:  userID,
			Name:    w.Name,
			Icon:    w.Icon,
			Color:   w.Color,
			Balance: 0,
		})
	}

	log.Printf("Seeded default categories and wallets for user %d", userID)
}
