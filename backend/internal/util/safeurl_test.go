package util

import (
	"net"
	"testing"
)

func TestIsPublicIP(t *testing.T) {
	cases := []struct {
		ip     string
		public bool
		why    string
	}{
		{"8.8.8.8", true, "publik biasa"},
		{"2606:4700:4700::1111", true, "IPv6 publik"},
		{"127.0.0.1", false, "loopback"},
		{"::1", false, "loopback IPv6"},
		{"10.0.0.5", false, "privat 10/8"},
		{"172.16.0.1", false, "privat 172.16/12"},
		{"172.32.0.1", true, "di luar 172.16/12, tetap publik"},
		{"192.168.1.1", false, "privat 192.168/16"},
		{"169.254.169.254", false, "metadata cloud"},
		{"0.0.0.0", false, "unspecified"},
		{"100.64.0.1", false, "CGNAT, tidak dicakup IsPrivate"},
		{"100.128.0.1", true, "di luar CGNAT 100.64/10"},
		{"fd00::1", false, "unique local IPv6"},
		{"::ffff:127.0.0.1", false, "loopback diselundupkan sebagai IPv4-mapped"},
		{"::ffff:10.0.0.1", false, "privat diselundupkan sebagai IPv4-mapped"},
		{"224.0.0.1", false, "multicast"},
	}

	for _, tc := range cases {
		ip := net.ParseIP(tc.ip)
		if ip == nil {
			t.Fatalf("%s: alamat uji tidak bisa di-parse", tc.ip)
		}
		if got := isPublicIP(ip); got != tc.public {
			t.Errorf("isPublicIP(%s) = %v, mau %v (%s)", tc.ip, got, tc.public, tc.why)
		}
	}

	if isPublicIP(nil) {
		t.Error("isPublicIP(nil) harus false")
	}
}

func TestValidateExternalURL(t *testing.T) {
	rejected := map[string]string{
		"http://openrouter.ai/api/v1":     "http polos",
		"https://127.0.0.1:9099":          "loopback literal",
		"https://169.254.169.254/latest":  "metadata cloud",
		"https://10.0.0.5/v1":             "alamat privat",
		"https://user:pass@openrouter.ai": "kredensial di URL",
		"https://":                        "tanpa host",
		"ftp://openrouter.ai":             "skema bukan https",
		"":                                "kosong",
	}

	for raw, why := range rejected {
		if err := ValidateExternalURL(raw); err == nil {
			t.Errorf("ValidateExternalURL(%q) lolos, seharusnya ditolak (%s)", raw, why)
		}
	}

	if err := ValidateExternalURL("https://openrouter.ai/api/v1"); err != nil {
		t.Errorf("URL provider sah ditolak: %v", err)
	}
}
