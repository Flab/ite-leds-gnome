#!/bin/bash
# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026 Fabio Gagliardi
# Remove the DKMS build installed by install-driver.sh.
# If another version of ite-8291-lb is registered in DKMS, reinstall it
# yourself afterwards with: dkms install ite-8291-lb/<version>
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run as root: sudo $0" >&2; exit 1; }

modprobe -r ite_8291_lb 2>/dev/null || true
dkms remove ite-8291-lb/1.1.0 --all
rm -rf /usr/src/ite-8291-lb-1.1.0
echo "done. The lightbar LED disappears until a driver is installed again."
