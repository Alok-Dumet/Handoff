#!/usr/bin/env bash
set -euo pipefail

sound_path='C:\Users\aenug\Desktop\Sounds\clash.wav'

if command -v powershell.exe >/dev/null 2>&1; then
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "\$player = New-Object System.Media.SoundPlayer '$sound_path'; \$player.PlaySync()"
elif command -v pwsh.exe >/dev/null 2>&1; then
  pwsh.exe -NoProfile -ExecutionPolicy Bypass -Command "\$player = New-Object System.Media.SoundPlayer '$sound_path'; \$player.PlaySync()"
elif command -v paplay >/dev/null 2>&1; then
  paplay /mnt/c/Users/aenug/Desktop/Sounds/clash.wav
elif command -v aplay >/dev/null 2>&1; then
  aplay /mnt/c/Users/aenug/Desktop/Sounds/clash.wav
fi
