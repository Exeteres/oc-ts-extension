#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
echo $DIR

leave() {
    echo -n "Hit any key to close the terminal"
    read
    exit
}

success() {
    echo -e "\033[1;32m$1\033[0m"
    leave
}

error() {
    echo -e "\033[0;31m$1\033[0m"
    leave
}

run() {
    echo -e "+ \033[1;34m$@\033[0m"
    $@
}

echo Checking NodeJS
run "node --version" || error "NodeJS not installed!"
echo

echo Installing json tool
run "sudo npm install -g json" || error "Error while installing json"
echo

echo Creating package
run "npm init --yes" || error "Error while initializing package"
echo

echo Adding scripts
(
    run "json -I -f package.json -e 'this.scripts.build=\"tstl\"'"
    echo -e "+ \033[1;34mjson -I -f package.json -e 'this.scripts.build=\"tstl --watch\"'\033[0m"
    json -I -f package.json -e 'this.scripts.build="tstl --watch"'
) || error "Error while editing scripts"
echo

echo Creating tsconfig.json
run cp $DIR/assets/tsconfig.json- tsconfig.json || error "Error while creating tsconfig.json"
echo

echo Creating src directory
run mkdir -p src || error "Error while creating src directory"
echo

echo Creating main.ts
run cp $DIR/assets/main.ts- src/main.ts || error "Error while creating main.ts"
echo

echo Creating .vscode directory
run mkdir -p .vscode || error "Error while creating .vscode directory"
echo

echo Creating launch.json
run cp $DIR/assets/launch.json .vscode/launch.json || error "Error while creating launch.json"
echo

echo Installing dependencies
(
    run "npm install typescript-to-lua @opct/openos -D"
) || error "Error while installing dependencies"
echo

success "Your work environment has been successfully prepared!"