package main

import (
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func main() {
	r := mux.NewRouter()
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./public")))
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatal(err)
	}
}