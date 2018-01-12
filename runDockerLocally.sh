#!/bin/bash

# FB_EMAIL="codazzo@gmail.com" FB_PASS="mafacciamlfacebookcazodai!" docker-compose up

# -v ~/nginxlogs:/var/log/nginx

docker build -t zampa-api . && docker run -v ~/screenshots:/tmp/screenshots -p 3001:3001 --env-file .env zampa-api
