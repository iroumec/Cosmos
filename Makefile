run:
	@npm run dev

clean:
	@npm cache clean --force

# =================================================================================================

git-uncache: ## Unchaches all the files from git.
	@git rm -r --cached .

install-sonar-qube-scanner: ## Installs the SonarQube scanner. It must be done once.
	@sudo npm install -g @sonar/scan

run-sonar-qube-scanner: ## Run a SonarQube analysis. Requires SonarQube running in a Docker container.
	@sonar \
	-Dsonar.host.url=http://localhost:9000 \
	-Dsonar.token=sqp_8308d783453b675a7a7c24c5fbc698823588ec57 \
	-Dsonar.projectKey=Cosmos

docker-compose-up: ## It initializes SonarQube.
	@docker compose up

add-user-to-docker-group: ## Use in case you receive `unable to get image 'x': permission denied while trying to connect to the docker API at unix:///var/run/docker.sock`.
	@sudo usermod -a -G docker $$USER
	@newgrp docker

docker-stop-all-containers:
	@docker stop $$(docker ps -a -q)

docker-remove-all-containers:
	@docker rm $$(docker ps -a -q)

merge-upstream: ## Merges in upstream changes.
	@git rebase upstream/main
	@git checkout master
	@git merge upstream/master

add-upstream: ## Adds an upstream remote.
	@git remote add upstream https://github.com/AgusDropOut/cosmos
	@git fetch upstream