#!/bin/bash

set -e

SCRIPT_DIR="$(dirname $0)"
cd "$SCRIPT_DIR/.."

if [ "$(docker images -q athena:latest 2> /dev/null)" == "" ]; then
    scripts/build_docker.sh
fi

if [ "$(docker ps -a -q -f name=athena)" ]; then
    docker start -ai athena | tee -a athena.log
    exit 0
fi

docker run --name athena -v "$(pwd)/configs:/app/configs" --net=host -it athena:latest | tee -a athena.log
