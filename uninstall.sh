#!/bin/bash
# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026 Fabio Gagliardi
# Undo install.sh: remove the ite-leds command, udev rule and boot service.
# The kernel driver is removed separately with uninstall-driver.sh.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run as root: sudo $0" >&2; exit 1; }

systemctl disable --now ite-leds.service 2>/dev/null || true
rm -f /etc/systemd/system/ite-leds.service
rm -f /etc/udev/rules.d/99-ite-leds.rules /usr/local/sbin/ite-leds /usr/local/bin/ite-leds
if [ -e /etc/udev/rules.d/99-ite8291.rules.bak ]; then
    mv /etc/udev/rules.d/99-ite8291.rules.bak /etc/udev/rules.d/99-ite8291.rules
fi
systemctl daemon-reload
udevadm control --reload
if [ -e /etc/systemd/system/keyboard-backlight.service ]; then
    systemctl enable keyboard-backlight.service
    echo "re-enabled the previous keyboard-backlight.service"
fi
echo "done. /etc/ite-leds.conf was kept: delete it if you do not need it."
