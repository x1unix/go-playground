DOCKERFILE ?= ./build/Dockerfile
IMG_NAME ?= x1unix/go-playground

.PHONY: docker
docker: docker-image docker-push-image
	@echo ":: [✓] Done"

.PHONY: docker-push-image
docker-push-image: docker-login
	@if [ -z "$(TAG)" ]; then\
		echo "required parameter TAG is undefined" && exit 1; \
	fi;
	@echo ":: Pushing $(IMG_NAME):$(TAG) (as latest)..."
	docker push $(IMG_NAME):$(TAG)
	docker push $(IMG_NAME):latest

.PHONY: docker-login
docker-login:
	@if [ -z "$(DOCKER_USER)" ]; then\
		echo "required parameter DOCKER_USER is undefined" && exit 1; \
	fi;
	@if [ -z "$(DOCKER_PASS)" ]; then\
		echo "required parameter DOCKER_PASS is undefined" && exit 1; \
	fi;
	@docker login -u $(DOCKER_USER) -p $(DOCKER_PASS) && echo "- Docker login success";

.PHONY: docker-image
docker-image:
	@if [ -z "$(TAG)" ]; then\
		echo "required parameter TAG is undefined" && exit 1; \
	fi;
	@echo ":: Building '$(IMG_NAME):latest' $(TAG)..."
	docker image build -t $(IMG_NAME):latest -t $(IMG_NAME):$(TAG) -f $(DOCKERFILE) \
		--build-arg APP_VERSION=$(TAG) \
		.
