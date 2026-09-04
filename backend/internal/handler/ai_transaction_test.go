package handler

import (
	"testing"

	"catat-keuangan-backend/internal/model"
)

func TestMatchWalletByName(t *testing.T) {
	wallets := []model.Wallet{
		{ID: 1, Name: "Dompet"},
		{ID: 2, Name: "Bank"},
		{ID: 3, Name: "Bank BCA"},
		{ID: 4, Name: "E-Wallet"},
	}

	cases := []struct {
		kalimat string
		mau     *uint
		alasan  string
	}{
		{"beli kopi 25 ribu pakai dompet", ptr(1), "sebutan persis"},
		{"beli kopi 25 ribu pakai DOMPET", ptr(1), "beda besar kecil huruf"},
		{"transfer 100 ribu dari bank bca", ptr(3), "nama terpanjang menang atas \"Bank\""},
		{"tarik tunai 50 ribu dari bank", ptr(2), "nama pendek tetap cocok kalau sendirian"},
		{"bayar listrik 150 ribu", nil, "tidak menyebut kantong"},
		{"jajan 10 ribu pakai ovo", nil, "kantong tidak ada di daftar"},
	}

	for _, tc := range cases {
		got := matchWalletByName(tc.kalimat, wallets)
		switch {
		case tc.mau == nil && got != nil:
			t.Errorf("%q: dapat kantong %d, mau tidak ada (%s)", tc.kalimat, *got, tc.alasan)
		case tc.mau != nil && got == nil:
			t.Errorf("%q: tidak dapat kantong, mau %d (%s)", tc.kalimat, *tc.mau, tc.alasan)
		case tc.mau != nil && got != nil && *got != *tc.mau:
			t.Errorf("%q: dapat %d, mau %d (%s)", tc.kalimat, *got, *tc.mau, tc.alasan)
		}
	}

	if matchWalletByName("apa saja", nil) != nil {
		t.Error("daftar kantong kosong harus menghasilkan nil")
	}
}

func ptr(v uint) *uint { return &v }
