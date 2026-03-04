package util

import "fmt"

// ConflictError represents a 409 Conflict (e.g. duplicate resource).
type ConflictError struct {
	Message string
}

func (e *ConflictError) Error() string {
	return e.Message
}

// NewConflictError creates a ConflictError with the given message.
func NewConflictError(message string) *ConflictError {
	return &ConflictError{Message: message}
}

// ValidationError represents a 400 Bad Request (e.g. password policy violation).
// Named ServiceValidationError to avoid collision with the response helper.
type ServiceValidationError struct {
	Message string
}

func (e *ServiceValidationError) Error() string {
	return e.Message
}

// NewServiceValidationError creates a ServiceValidationError with the given message.
func NewServiceValidationError(message string) *ServiceValidationError {
	return &ServiceValidationError{Message: message}
}

// NewServiceValidationErrorf creates a ServiceValidationError with a formatted message.
func NewServiceValidationErrorf(format string, args ...interface{}) *ServiceValidationError {
	return &ServiceValidationError{Message: fmt.Sprintf(format, args...)}
}
