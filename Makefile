# Makefile for node-prometheus

# Variables
IMAGE  = cyrip/ask-chatgpt
TAG = 1.0.2

# targets
.PHONY: all

all: build

# Target to run the Ansible playbook
build:
	docker buildx build -t ${IMAGE}:${TAG} .
	docker push ${IMAGE}:${TAG}
run:
	docker run --rm --init -p 3000:3000 ${IMAGE}:${TAG}
