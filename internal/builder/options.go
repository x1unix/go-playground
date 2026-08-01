package builder

import (
	"fmt"
	"strings"
)

type BuildOptions struct {
	CompilerOptions []string
}

var compilerOptionsWithValues = map[string]struct{}{
	"-asmflags": {},
	"-gcflags":  {},
	"-ldflags":  {},
	"-tags":     {},
}

var compilerOptionsWithoutValues = map[string]struct{}{
	"-trimpath": {},
}

func ParseCompilerOptions(raw string) ([]string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}

	tokens, err := splitCommandLine(raw)
	if err != nil {
		return nil, err
	}

	result := make([]string, 0, len(tokens))
	for i := 0; i < len(tokens); i++ {
		token := tokens[i]
		if token == "" {
			continue
		}

		name, value, hasValue := strings.Cut(token, "=")
		if _, ok := compilerOptionsWithoutValues[name]; ok {
			if hasValue {
				return nil, fmt.Errorf("compiler option %q does not accept a value", name)
			}

			result = append(result, token)
			continue
		}

		if _, ok := compilerOptionsWithValues[name]; ok {
			if hasValue {
				if strings.TrimSpace(value) == "" {
					return nil, fmt.Errorf("compiler option %q requires a value", name)
				}

				result = append(result, token)
				continue
			}

			if i+1 >= len(tokens) {
				return nil, fmt.Errorf("compiler option %q requires a value", name)
			}

			result = append(result, token, tokens[i+1])
			i++
			continue
		}

		return nil, fmt.Errorf(
			"unsupported compiler option %q (allowed: -asmflags, -gcflags, -ldflags, -tags, -trimpath)",
			name,
		)
	}

	return result, nil
}

func splitCommandLine(input string) ([]string, error) {
	var (
		out     []string
		current strings.Builder
		quote   rune
		escaped bool
	)

	flush := func() {
		if current.Len() == 0 {
			return
		}

		out = append(out, current.String())
		current.Reset()
	}

	for _, ch := range input {
		switch {
		case escaped:
			current.WriteRune(ch)
			escaped = false
		case ch == '\\' && quote != '\'':
			escaped = true
		case quote != 0:
			if ch == quote {
				quote = 0
				continue
			}

			current.WriteRune(ch)
		case ch == '\'' || ch == '"':
			quote = ch
		case ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r':
			flush()
		default:
			current.WriteRune(ch)
		}
	}

	if escaped {
		return nil, fmt.Errorf("unterminated escape sequence in compiler options")
	}

	if quote != 0 {
		return nil, fmt.Errorf("unterminated quoted string in compiler options")
	}

	flush()
	return out, nil
}
