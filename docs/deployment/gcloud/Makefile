TF ?= terraform
GCLOUD ?= gcloud
TFPLAN ?=tfplan
VARS ?=prod.tfvars

.PHONY: plan
plan:
	$(TF) plan -var-file=$(VARS) -out $(TFPLAN)

.PHONY: init
init:
	$(GCLOUD) auth application-default login
	$(TF) init

.PHONY: apply
apply:
	$(TF) apply $(TFPLAN)

.PHONY: destroy
destroy:
	$(TF) destroy -var-file=$(VARS)

