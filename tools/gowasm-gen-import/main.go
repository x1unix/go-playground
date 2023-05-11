package main

import (
	"bytes"
	_ "embed"
	"fmt"
	"github.com/spf13/cobra"
	"go/ast"
	"go/parser"
	"go/token"
	"io"
	"os"
	"path/filepath"
	"strings"
	"text/template"
	"time"

	"github.com/samber/lo"
)

const (
	importDirective = "gowasm:import"
	programName     = "gowasm-gen-import"
)

//go:embed template.gohtml
var tplData []byte

type exportFuncDecl struct {
	Name      string
	Signature string
}

type fileTemplateData struct {
	SourceFile   string
	CreatedAt    time.Time
	ProgramName  string
	Declarations []exportFuncDecl
}

func main() {
	dryRun := false
	cmd := cobra.Command{
		Use:     programName + " [flags] filename",
		Short:   programName + " - Generate assembly file for external WASM functions.",
		Example: programName + " internal/gowasm/syscall_js.go",
		Args:    cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return run(args[0], dryRun)
		},
		SilenceErrors: true,
		SilenceUsage:  true,
	}
	cmd.Flags().
		BoolVarP(&dryRun, "dry-run", "d", false, "Output to stdout instead of file")

	if err := cmd.Execute(); err != nil {
		_, _ = fmt.Fprintln(os.Stderr, "ERROR:", err)
		os.Exit(1)
		return
	}
}

func run(fileName string, dryRun bool) error {
	tpl, err := template.New("gowasm-import-template.s").Parse(string(tplData))
	if err != nil {
		return fmt.Errorf("failed to load assembly file template: %w", err)
	}

	if filepath.Ext(fileName) != ".go" {
		return fmt.Errorf("file %s is not a Go source file", fileName)
	}

	data, err := os.ReadFile(fileName)
	if err != nil {
		return err
	}

	fset := token.NewFileSet()
	p, err := parser.ParseFile(fset, fileName, data, parser.ParseComments|parser.SkipObjectResolution)
	if err != nil {
		return err
	}

	if len(p.Decls) == 0 {
		return nil
	}

	decls := traverseDecls(data, p.Decls)
	if len(decls) == 0 {
		return nil
	}

	var writer io.WriteCloser = os.Stdout
	destFileName := strings.TrimSuffix(fileName, filepath.Ext(fileName)) + ".s"
	if !dryRun {
		writer, err = os.OpenFile(destFileName, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0644)
		if err != nil {
			return fmt.Errorf("failed to create output file: %w", err)
		}
		defer writer.Close()
	}

	if err = writeAsmFile(tpl, writer, fileName, decls); err != nil {
		return err
	}

	if !dryRun {
		absPath, err := filepath.Abs(destFileName)
		if err != nil {
			absPath = destFileName
		}

		fmt.Println("Generated: ", absPath)
	}
	return nil
}

func writeAsmFile(tpl *template.Template, dst io.Writer, srcFile string, decls []exportFuncDecl) error {
	tplData := &fileTemplateData{
		SourceFile:   filepath.Base(srcFile),
		CreatedAt:    time.Now(),
		ProgramName:  programName,
		Declarations: decls,
	}

	if err := tpl.Execute(dst, tplData); err != nil {
		return fmt.Errorf("failed to generate file: %w", err)
	}

	return nil
}

func traverseDecls(src []byte, decls []ast.Decl) []exportFuncDecl {
	if len(decls) == 0 {
		return nil
	}

	result := make([]exportFuncDecl, 0, len(decls))
	for _, decl := range decls {
		funcDecl, ok := decl.(*ast.FuncDecl)
		if !ok {
			continue
		}

		if !hasCallExportDirective(funcDecl.Doc) {
			continue
		}

		// parser skips first character
		start := funcDecl.Pos() - 1
		end := funcDecl.End()

		result = append(result, exportFuncDecl{
			Name:      funcDecl.Name.String(),
			Signature: string(bytes.TrimSpace(src[start:end])),
		})
	}

	return result
}

func hasCallExportDirective(doc *ast.CommentGroup) bool {
	if doc == nil {
		return false
	}

	directives := lo.Filter(
		lo.Map(doc.List, func(comment *ast.Comment, _ int) string {
			return strings.TrimSpace(strings.TrimPrefix(comment.Text, "//"))
		}),
		func(comment string, _ int) bool {
			return comment == importDirective
		},
	)

	return len(directives) != 0
}
