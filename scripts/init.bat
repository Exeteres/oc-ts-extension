@echo off

:: Script directory
SET scriptDir=%~dp0

:: Colored output support
SETLOCAL EnableDelayedExpansion
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "DEL=%%a"
)

echo Checking NodeJS
call :run "node --version" || call :error "NodeJS not installed!"
echo.

echo Installing json tool
call :run "call npm install -g json" || call :error "Error while installing json"
echo.

echo Creating package
call :run "call npm init --yes" || call :error "Error while initializing package"
echo.

echo Adding scripts
(
    call :run "call json -I -f package.json -e this.scripts.build='tstl'"

    :: сука как же я люблю batch скрипты
    call :color 0B "+ call json -I -f package.json -e this.scripts.watch='tstl --watch'"
    echo.
    call json -I -f package.json -e "this.scripts.watch=""tstl --watch"""
) || call :error "Error while editing scripts"
echo.

echo Creating tsconfig.json
copy %scriptDir%assets\tsconfig.json- tsconfig.json || call :error "Error while creating tsconfig.json"
echo.

echo Creating src directory
call :run "mkdir src" || call :error "Error while creating src directory"
echo.

echo Creating main.ts
copy %scriptDir%assets\main.ts- src\main.ts || call :error "Error while creating main.ts"
echo.

echo Creating .vscode directory
call :run "mkdir .vscode" || call :error "Error while creating .vscode directory"
echo.

echo Creating launch.json
copy %scriptDir%assets\launch.json .vscode\launch.json || call :error "Error while creating launch.json"
echo.

echo Installing dependencies
(
    call npm install typescript-to-lua ^@opct/openos -D
) || call :error "Error while installing dependencies"
echo.

call :success "Your work environment has been successfully prepared!"

:: Leave with confirmation
:leave
    set /p temp="Hit any key to close the terminal"
    exit 0
EXIT /B 0

:: Run command and write it to output 
:run
    call :color 0B "+ %~1"
    echo.
    %~1%
EXIT /B 0

:: Show error and leave with confirmation
:success
    call :color 0A "%~1"
    echo.
    call :leave
    exit
EXIT /B 0

:: Show error and leave with confirmation
:error
    call :color 0C "%~1"
    echo.
    call :leave
    exit
EXIT /B 0

:: Color text (https://stackoverflow.com/a/23072489/10502674)
:color
    echo off
    <nul set /p ".=%DEL%" > "%~2"
    findstr /v /a:%1 /R "^$" "%~2" nul
    del "%~2" > nul 2>&1
EXIT /B 0