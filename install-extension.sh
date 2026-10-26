#!/bin/bash
# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026 Fabio Gagliardi
# Install the GNOME Shell extension for the current user (no root needed).
set -euo pipefail
[ "$(id -u)" != 0 ] || { echo "run as your user, not root" >&2; exit 1; }
HERE=$(cd "$(dirname "$0")" && pwd)
DEST="$HOME/.local/share/gnome-shell/extensions/ite-leds@local"
mkdir -p "$DEST"
cp "$HERE"/gnome-extension/ite-leds@local/{extension.js,ledctl.js,prefs.js,metadata.json} "$DEST/"
echo "installed in $DEST"
echo "On Wayland, log out and in once, then run: gnome-extensions enable ite-leds@local"
