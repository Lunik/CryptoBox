#!/bin/sh

APP_PATH=$(realpath $(dirname $(dirname "$0")))

cd "$APP_PATH"

npm start