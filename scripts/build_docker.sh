#!/bin/bash

set -e

SCRIPT_DIR="$(dirname $0)"
cd "$SCRIPT_DIR/.."

docker build --network host -t athena-ai/athena-core:latest .
