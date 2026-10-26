#!/bin/bash
# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026 Fabio Gagliardi
# Install driver/ (ite_8291_lb 1.1.0) through DKMS and reload it.
# Remove it again with uninstall-driver.sh. If you had another version of
# ite-8291-lb registered in DKMS, reinstall it afterwards with:
#   sudo dkms install ite-8291-lb/<version>
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run as root: sudo $0" >&2; exit 1; }

VER=1.1.0
SRC=/usr/src/ite-8291-lb-$VER
HERE=$(cd "$(dirname "$0")" && pwd)

install -d "$SRC"
install -m 644 "$HERE"/driver/{ite_8291_lb.c,Kbuild,Makefile,dkms.conf} "$SRC/"

dkms add -m ite-8291-lb -v $VER 2>/dev/null || true
dkms build -m ite-8291-lb -v $VER
dkms install -m ite-8291-lb -v $VER --force

modprobe -r ite_8291_lb 2>/dev/null || true
modprobe ite_8291_lb
echo "loaded: $(modinfo -F version ite_8291_lb 2>/dev/null) $(modinfo -F filename ite_8291_lb)"
ls /sys/class/leds/ | grep -i lightbar || echo "no lightbar LED found"
