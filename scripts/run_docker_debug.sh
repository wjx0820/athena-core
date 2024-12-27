#!/bin/bash

set -e

SCRIPT_DIR="$(dirname $0)"
cd "$SCRIPT_DIR/.."

npm run build
docker run -v "$(pwd):/app" --net=host -it athena:latest
