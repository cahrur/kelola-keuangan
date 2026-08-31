package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"catat-keuangan-backend/internal/config"
	"catat-keuangan-backend/internal/model"
	"catat-keuangan-backend/internal/util"

	"github.com/gin-gonic/gin"
)

type parseTransactionRequest struct {
	Text string `json:"text" binding:"required,min=2,max=500"`
}

// parsedTransaction is the shape the model is asked to produce. It is a draft the
// user still confirms in the app — nothing is written to the database here.
type parsedTransaction struct {
	Type        string  `json:"type"`
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
	CategoryID  *uint   `json:"category_id"`
	WalletID    *uint   `json:"wallet_id"`
	Date        string  `json:"date"`
}

const parseTransactionPrompt = `Kamu mengubah kalimat bahasa Indonesia menjadi satu transaksi keuangan.

Balas HANYA dengan JSON, tanpa penjelasan, tanpa blok kode:
{"type":"income|expense","amount":<angka>,"description":"<teks singkat>","category_id":<id atau null>,"wallet_id":<id atau null>,"date":"YYYY-MM-DD"}

Aturan:
- "amount" dalam rupiah sebagai angka polos. "dua puluh dua ribu" = 22000, "seratus lima puluh ribu" = 150000, "sejuta" = 1000000.
- "type" adalah "income" hanya jika kalimatnya jelas tentang uang masuk (gaji, terima, dapat, bonus). Selain itu "expense".
- "category_id" dipilih dari daftar kategori di bawah dan tipenya harus sama dengan "type". Jika tidak ada yang cocok, isi null.
- "wallet_id" dipilih dari daftar kantong di bawah, hanya jika kalimatnya menyebut sumber dana (pakai gopay, dari bank, tunai, cash, dompet). Jika tidak disebut, isi null.
- "description" ringkas, ambil dari kalimat aslinya. Jangan mengarang.
- "date" memakai tanggal hari ini kecuali kalimatnya menyebut waktu lain (kemarin, 3 hari lalu).
- Jika kalimat tidak menyebut nominal sama sekali, balas {"error":"no_amount"}.`

// ParseTransaction turns a spoken sentence into a draft transaction.
//
// It deliberately uses the server AI configuration rather than resolveAIConfig:
// voice input should work for every user, including those who never filled in
// their own API key in Settings.
//
// Nothing is persisted. The model's output is treated as untrusted input and is
// validated field by field — a category id is only accepted when it really
// belongs to this user and matches the transaction type.
func (h *AIHandler) ParseTransaction(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req parseTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.ValidationError(c, "Validation failed", "Teks tidak valid")
		return
	}

	baseURL := strings.TrimRight(config.AppConfig.AIBaseURL, "/")
	if baseURL == "" || config.AppConfig.AIAPIKey == "" {
		util.Error(c, http.StatusServiceUnavailable, "Fitur input suara belum tersedia")
		return
	}

	var categories []model.Category
	h.DB.Where("user_id = ?", userID).Find(&categories)

	var wallets []model.Wallet
	h.DB.Where("user_id = ?", userID).Find(&wallets)

	content, err := h.callAI(baseURL, config.AppConfig.AIAPIKey, config.AppConfig.AIModel, []map[string]string{
		{"role": "system", "content": buildParsePrompt(categories, wallets)},
		{"role": "user", "content": req.Text},
	})
	if err != nil {
		util.Error(c, http.StatusBadGateway, "Gagal memproses suara. Coba lagi.")
		return
	}

	parsed, err := decodeParsedTransaction(content)
	if err != nil {
		util.Error(c, http.StatusUnprocessableEntity, "Tidak menemukan nominal transaksi. Coba ucapkan lagi dengan jelas.")
		return
	}

	normalizeParsedTransaction(parsed, categories, wallets)

	util.Success(c, http.StatusOK, "Transaksi terbaca", parsed)
}

func buildParsePrompt(categories []model.Category, wallets []model.Wallet) string {
	var sb strings.Builder
	sb.WriteString(parseTransactionPrompt)
	sb.WriteString("\n\nTanggal hari ini: ")
	sb.WriteString(nowInJakarta().Format("2006-01-02"))
	sb.WriteString("\n\nDaftar kategori:\n")

	for _, cat := range categories {
		fmt.Fprintf(&sb, "- id=%d, nama=%s, tipe=%s\n", cat.ID, cat.Name, cat.Type)
	}
	sb.WriteString("\nDaftar kantong:\n")
	for _, wallet := range wallets {
		fmt.Fprintf(&sb, "- id=%d, nama=%s\n", wallet.ID, wallet.Name)
	}
	return sb.String()
}

// decodeParsedTransaction pulls the JSON object out of the model's reply. Models
// wrap JSON in prose or code fences often enough that trimming to the outermost
// braces is more reliable than trusting the response to be clean.
func decodeParsedTransaction(content string) (*parsedTransaction, error) {
	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	if start < 0 || end <= start {
		return nil, fmt.Errorf("tidak ada JSON dalam response")
	}

	var parsed parsedTransaction
	if err := json.Unmarshal([]byte(content[start:end+1]), &parsed); err != nil {
		return nil, err
	}

	// The prompt asks for {"error":"no_amount"} when the sentence has no figure,
	// which decodes into a zero amount here.
	if parsed.Amount <= 0 {
		return nil, fmt.Errorf("nominal tidak ditemukan")
	}
	return &parsed, nil
}

// normalizeParsedTransaction forces every field into a value the app can use, so
// a confused model cannot produce a draft the transaction form would choke on.
func normalizeParsedTransaction(parsed *parsedTransaction, categories []model.Category, wallets []model.Wallet) {
	if parsed.Type != "income" {
		parsed.Type = "expense"
	}

	parsed.Description = strings.TrimSpace(parsed.Description)
	if parsed.Description == "" {
		parsed.Description = "Transaksi"
	} else if len([]rune(parsed.Description)) > 100 {
		parsed.Description = string([]rune(parsed.Description)[:100])
	}

	// A hallucinated or foreign category id must never reach the client.
	if parsed.CategoryID != nil {
		valid := false
		for _, cat := range categories {
			if cat.ID == *parsed.CategoryID && cat.Type == parsed.Type {
				valid = true
				break
			}
		}
		if !valid {
			parsed.CategoryID = nil
		}
	}

	// Kantong asing atau hasil karangan tidak boleh sampai ke klien.
	if parsed.WalletID != nil {
		valid := false
		for _, wallet := range wallets {
			if wallet.ID == *parsed.WalletID {
				valid = true
				break
			}
		}
		if !valid {
			parsed.WalletID = nil
		}
	}

	if _, err := time.Parse("2006-01-02", parsed.Date); err != nil {
		parsed.Date = nowInJakarta().Format("2006-01-02")
	}
}
