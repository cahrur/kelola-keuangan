package util

import "github.com/gin-gonic/gin"

// Standard success response per api-standards skill
func Success(c *gin.Context, status int, message string, data interface{}) {
	c.JSON(status, gin.H{
		"success": true,
		"message": message,
		"data":    data,
	})
}

// Standard success response with pagination meta
func SuccessWithMeta(c *gin.Context, message string, data interface{}, meta interface{}) {
	c.JSON(200, gin.H{
		"success": true,
		"message": message,
		"data":    data,
		"meta":    meta,
	})
}

// Standard error response per api-standards skill
func Error(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{
		"success": false,
		"message": message,
	})
}

// Validation error response with field-level errors
func ValidationError(c *gin.Context, message string, errors interface{}) {
	c.JSON(400, gin.H{
		"success": false,
		"message": message,
		"errors":  errors,
	})
}
