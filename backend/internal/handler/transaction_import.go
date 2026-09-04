package handler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"catat-keuangan-backend/internal/model"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// maxImportRows caps a single import so one request cannot lock the table for
// long or exhaust memory. Bigger files are split by the client.
const maxImportRows = 2000

// importRow mirrors the exported columns. Category and wallet arrive as names,
// not ids: a file exported from one account must import into another, where the
// same category carries a different id.
type importRow struct {
	Type        string  `json:"type"`
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	Wallet      string  `json:"wallet"`
	Date        string  `json:"date"`
}

type importRequest struct {
	Transactions []importRow `json:"transactions" binding:"required,min=1"`
}

type importError struct {
	Row    int    `json:"row"`
	Reason string `json:"reason"`
}

// ImportTransactions bulk-inserts transactions parsed from a CSV or Excel file.
//
// Rows are validated individually: a bad row is reported and skipped rather than
// failing the whole file, because a single stray line in a spreadsheet should not
// cost the user the other nine hundred. Everything that does pass is written in
// one database transaction, so an unexpected failure leaves no half-imported set.
func (h *TransactionHandler) ImportTransactions(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var req importRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", "Format data impor tidak valid")
		return
	}

	if len(req.Transactions) > maxImportRows {
		util.ValidationError(c, "Validation failed",
			fmt.Sprintf("Maksimal %d baris per impor", maxImportRows))
		return
	}

	categories := lookupByName(h.DB, userID, &[]model.Category{})
	wallets := lookupByName(h.DB, userID, &[]model.Wallet{})

	var (
		valid    []model.Transaction
		failures []importError
	)

	for i, row := range req.Transactions {
		txn, err := row.toTransaction(userID, categories, wallets)
		if err != nil {
			// +2: spreadsheet rows are 1-based and the first line is the header.
			failures = append(failures, importError{Row: i + 2, Reason: err.Error()})
			continue
		}
		valid = append(valid, *txn)
	}

	if len(valid) == 0 {
		util.Error(c, http.StatusUnprocessableEntity, "Tidak ada baris yang bisa diimpor")
		return
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&valid).Error; err != nil {
			return err
		}

		// Wallet balances move with the transactions, exactly as Create() does.
		// Deltas are summed per wallet so each wallet is written once.
		deltas := map[uint]float64{}
		for _, txn := range valid {
			if txn.WalletID == nil {
				continue
			}
			delta := txn.Amount
			if txn.Type == "expense" {
				delta = -delta
			}
			deltas[*txn.WalletID] += delta
		}

		for walletID, delta := range deltas {
			if err := tx.Model(&model.Wallet{}).
				Where("id = ? AND user_id = ?", walletID, userID).
				Update("balance", gorm.Expr("balance + ?", delta)).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		util.Error(c, http.StatusInternalServerError, "Gagal menyimpan transaksi")
		return
	}

	util.Success(c, http.StatusOK, "Impor selesai", gin.H{
		"imported": len(valid),
		"skipped":  len(failures),
		"errors":   failures,
	})
}

// lookupByName maps lowercased names to ids so the importer can match what the
// user typed in a spreadsheet without worrying about capitalisation.
func lookupByName[T any](db *gorm.DB, userID uint, out *[]T) map[string]uint {
	db.Where("user_id = ?", userID).Find(out)

	index := map[string]uint{}
	for _, item := range *out {
		switch v := any(item).(type) {
		case model.Category:
			index[strings.ToLower(strings.TrimSpace(v.Name))] = v.ID
		case model.Wallet:
			index[strings.ToLower(strings.TrimSpace(v.Name))] = v.ID
		}
	}
	return index
}

func (r importRow) toTransaction(userID uint, categories, wallets map[string]uint) (*model.Transaction, error) {
	txnType := strings.ToLower(strings.TrimSpace(r.Type))
	if txnType != "income" && txnType != "expense" {
		return nil, fmt.Errorf("tipe harus income atau expense")
	}

	if r.Amount <= 0 {
		return nil, fmt.Errorf("jumlah harus lebih dari 0")
	}

	description := strings.TrimSpace(r.Description)
	if description == "" {
		return nil, fmt.Errorf("deskripsi kosong")
	}
	if len([]rune(description)) > 500 {
		description = string([]rune(description)[:500])
	}

	if _, err := time.Parse("2006-01-02", strings.TrimSpace(r.Date)); err != nil {
		return nil, fmt.Errorf("tanggal harus format YYYY-MM-DD")
	}

	categoryID, ok := categories[strings.ToLower(strings.TrimSpace(r.Category))]
	if !ok {
		return nil, fmt.Errorf("kategori %q tidak ditemukan", r.Category)
	}

	txn := model.Transaction{
		UserID:      userID,
		Type:        txnType,
		Amount:      r.Amount,
		Description: description,
		CategoryID:  categoryID,
		Date:        strings.TrimSpace(r.Date),
	}

	// An unknown wallet is not fatal: the transaction still belongs in the books,
	// it simply is not attributed to a wallet and leaves balances untouched.
	if walletID, ok := wallets[strings.ToLower(strings.TrimSpace(r.Wallet))]; ok {
		txn.WalletID = &walletID
	}

	return &txn, nil
}
