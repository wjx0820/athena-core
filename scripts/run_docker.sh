#!/bin/bash

set -e

SCRIPT_DIR="$(dirname $0)"
cd "$SCRIPT_DIR/.."

docker run -v "$(pwd)/configs/config.yaml:/app/configs/config.yaml" --net=host -it athena:latest
