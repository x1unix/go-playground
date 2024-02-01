package main

import (
	"fmt"
)

const (
	Escape = "\x1b["
	Reset  = Escape + "0m"

	Red     = Escape + "31m"
	Green   = Escape + "32m"
	Yellow  = Escape + "33m"
	Blue    = Escape + "34m"
	Magenta = Escape + "35m"
	Cyan    = Escape + "36m"
)

func main() {
	fmt.Println(Red + "This is red" + Reset)
	fmt.Println(Green + "This is green" + Reset)
	fmt.Println(Yellow + "This is yellow" + Reset)
	fmt.Println(Blue + "This is blue" + Reset)
	fmt.Println(Cyan + "This is cyan" + Reset)
	fmt.Println(Magenta + "This is magenta" + Reset)
}
