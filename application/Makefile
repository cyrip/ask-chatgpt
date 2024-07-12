# Makefile for node-prometheus

# Variables

# targets
.PHONY: all

all: create

# Target to create NS and APP
create:
	kubectl apply -f ns.yml
	kubectl apply -f application.yml
	kubectl apply -f secret.yml
