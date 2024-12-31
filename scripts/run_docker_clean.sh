#!/bin/bash

SCRIPT_DIR="$(dirname $0)"
cd "$SCRIPT_DIR/.."

docker rm athena
docker image rm athena:latest

scripts/run_docker.sh
