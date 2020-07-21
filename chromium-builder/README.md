## Introduction
This a build server for automatically building chromium binary for Windows 10 x64 system.

## Setup
- Install python3
  a. download from https://www.python.org/downloads/windows/
  b. double click to install
- Create log dir "C:\logs"
  `mkdir C:\logs`
- Setup windows build chromium environment to "C:\src\chromium2\". Follow official build guide:
  https://chromium.googlesource.com/chromium/src/+/master/docs/windows_build_instructions.md

## Usage
- Server run
  1. Start cmd, then choose 2 or 3.
  2. run in background:
    `start /b python3 build_server_chrome_x64.py > C:\logs\build_chrome_log.txt 2>&1`
  3. run in current terminal:
    `python3 build_server_chrome_x64.py`

- Client run
  1. Use socket
  2. Get server hostname or ip
  3. Socket connect to <server_hostname_or_ip>:8790
  4. Send build request:
    a. must use json format: {command: 'build', content: <the_commit_id_which_you_need_to_build_chrome>}
  5. Receive data fromat:
    a. json format: {status: <number>, msg: <message>}
    b. status means: 
      0: connect ok
      1: build succeed
      other number: build failed
