package util

// MaskPhone returns a safely masked phone string for logs.
// It never panics, even for short or empty strings.
func MaskPhone(phone string) string {
	if phone == "" {
		return ""
	}
	r := []rune(phone)
	n := 4
	if len(r) < n {
		n = len(r)
	}
	return string(r[:n]) + "******"
}
