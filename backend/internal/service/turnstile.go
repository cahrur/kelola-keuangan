package service

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const turnstileVerifyURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

type TurnstileService struct {
	secretKey  string
	httpClient *http.Client
}

type turnstileVerifyResponse struct {
	Success    bool     `json:"success"`
	ErrorCodes []string `json:"error-codes"`
}

func NewTurnstileService(secretKey string) *TurnstileService {
	return &TurnstileService{
		secretKey: strings.TrimSpace(secretKey),
		httpClient: &http.Client{
			Timeout: 8 * time.Second,
		},
	}
}

func (s *TurnstileService) IsEnabled() bool {
	return s.secretKey != ""
}

func (s *TurnstileService) Verify(token, remoteIP string) error {
	// Keep local development simple when secret is not configured.
	if !s.IsEnabled() {
		return nil
	}

	token = strings.TrimSpace(token)
	if token == "" {
		return errors.New("Verifikasi keamanan wajib diselesaikan")
	}

	form := url.Values{}
	form.Set("secret", s.secretKey)
	form.Set("response", token)
	if remoteIP != "" {
		form.Set("remoteip", remoteIP)
	}

	req, err := http.NewRequest(http.MethodPost, turnstileVerifyURL, strings.NewReader(form.Encode()))
	if err != nil {
		return errors.New("Gagal memproses verifikasi keamanan")
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return errors.New("Gagal menghubungi layanan verifikasi keamanan")
	}
	defer resp.Body.Close()

	var parsed turnstileVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return errors.New("Respons verifikasi keamanan tidak valid")
	}

	if parsed.Success {
		return nil
	}

	for _, code := range parsed.ErrorCodes {
		if code == "timeout-or-duplicate" {
			return errors.New("Verifikasi keamanan kadaluarsa. Silakan ulangi")
		}
	}

	return errors.New("Verifikasi keamanan gagal. Silakan coba lagi")
}
