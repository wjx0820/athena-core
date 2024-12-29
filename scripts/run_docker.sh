#!/bin/bash

set -e

SCRIPT_DIR="$(dirname $0)"
cd "$SCRIPT_DIR/.."

docker run -v "$(pwd)/configs:/app/configs" --net=host -it athena:latest
