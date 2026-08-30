package handler

import (
	"net/http"

	"catat-keuangan-backend/internal/config"

	"github.com/gin-gonic/gin"
)

const (
	refreshCookieName   = "refreshToken"
	refreshCookieMaxAge = 7 * 24 * 3600
)

// setRefreshCookie writes the httpOnly refresh cookie.
//
// The Android build runs the same web app from the fixed origin https://localhost,
// so from the WebView's point of view this cookie is third-party and only travels
// with SameSite=None. That in turn requires Secure, so plain-HTTP development keeps
// the stricter default instead.
//
// SameSite=None does not open a CSRF hole here: every state-changing endpoint
// authenticates on the Authorization header, which a cross-site page cannot set,
// and /auth/refresh answers with the new access token in a body that the
// attacker's origin is not allowed to read.
func setRefreshCookie(c *gin.Context, token string, maxAge int) {
	isSecure := config.AppConfig.AppEnv == "production"

	if isSecure {
		c.SetSameSite(http.SameSiteNoneMode)
	}

	c.SetCookie(refreshCookieName, token, maxAge, "/", "", isSecure, true)
}

// clearRefreshCookie expires the refresh cookie with the same attributes it was
// written with — a mismatched SameSite would leave the original cookie in place.
func clearRefreshCookie(c *gin.Context) {
	setRefreshCookie(c, "", -1)
}
