package util

import (
	"errors"
	"net"
	"net/http"
	"net/url"
	"strings"
	"syscall"
	"time"
)

// Guards against SSRF for URLs that the server fetches on a user's behalf.
//
// The AI base URL is configurable per user, which means an ordinary logged-in
// account can otherwise choose any address the server can reach: the container
// network, a database port, or the cloud metadata endpoint at 169.254.169.254.
// Responses shaped like an OpenAI reply come straight back as the assistant's
// answer, so the read is not blind.
//
// Two layers, because one is not enough:
//
//	ValidateExternalURL rejects a bad URL when it is saved, giving the user a
//	clear error instead of a mysterious failure later.
//
//	SafeHTTPClient rejects the connection itself. DNS can resolve to a public
//	address at save time and to 127.0.0.1 at request time (DNS rebinding), and
//	a public host can redirect somewhere internal. Validation alone misses both.

var (
	ErrURLInvalid     = errors.New("URL tidak valid")
	ErrURLNotHTTPS    = errors.New("URL harus memakai https")
	ErrURLCredentials = errors.New("URL tidak boleh memuat kredensial")
	ErrURLNoHost      = errors.New("URL harus memuat nama host")
	ErrURLUnresolved  = errors.New("nama host tidak bisa diresolusi")
	ErrURLInternal    = errors.New("URL mengarah ke alamat jaringan internal")
)

// ValidateExternalURL reports whether the server may fetch this URL.
func ValidateExternalURL(raw string) error {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return ErrURLInvalid
	}

	// https only. Plain http would let an attacker on the path read the API key
	// in the Authorization header, and it is never needed by a real provider.
	if parsed.Scheme != "https" {
		return ErrURLNotHTTPS
	}
	if parsed.User != nil {
		return ErrURLCredentials
	}

	host := parsed.Hostname()
	if host == "" {
		return ErrURLNoHost
	}

	// A literal internal address is caught here; a hostname is resolved so that
	// something like internal.example.com pointing at 10.0.0.5 is caught too.
	ips, err := net.LookupIP(host)
	if err != nil || len(ips) == 0 {
		return ErrURLUnresolved
	}
	for _, ip := range ips {
		if !isPublicIP(ip) {
			return ErrURLInternal
		}
	}
	return nil
}

// isPublicIP reports whether an address is routable on the public internet.
func isPublicIP(ip net.IP) bool {
	if ip == nil {
		return false
	}
	if ip.IsLoopback() || ip.IsPrivate() || ip.IsUnspecified() ||
		ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() ||
		ip.IsInterfaceLocalMulticast() || ip.IsMulticast() {
		return false
	}

	// Carrier-grade NAT (100.64.0.0/10). IsPrivate does not cover it, and
	// hosting providers do route internal traffic through this range.
	if v4 := ip.To4(); v4 != nil && v4[0] == 100 && v4[1]&0xC0 == 64 {
		return false
	}
	return true
}

// SafeHTTPClient returns a client that refuses to open a connection to an
// internal address and refuses to follow redirects.
//
// Note for future self-hosting: if a model is ever run inside the same Docker
// network, this guard will block it, because that address is private by
// definition. Relaxing it means exempting the server-configured base URL here —
// never the per-user one.
func SafeHTTPClient(timeout time.Duration) *http.Client {
	dialer := &net.Dialer{
		Timeout:   10 * time.Second,
		KeepAlive: 30 * time.Second,
		// Control runs after DNS resolution with the address actually being
		// dialled, which is what closes the rebinding window.
		Control: func(_, address string, _ syscall.RawConn) error {
			host, _, err := net.SplitHostPort(address)
			if err != nil {
				return ErrURLInvalid
			}
			if !isPublicIP(net.ParseIP(host)) {
				return ErrURLInternal
			}
			return nil
		},
	}

	return &http.Client{
		Timeout: timeout,
		Transport: &http.Transport{
			DialContext:           dialer.DialContext,
			TLSHandshakeTimeout:   10 * time.Second,
			ResponseHeaderTimeout: 60 * time.Second,
		},
		CheckRedirect: func(*http.Request, []*http.Request) error {
			return errors.New("redirect tidak diizinkan")
		},
	}
}
