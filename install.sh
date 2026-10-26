#!/bin/bash
# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026 Fabio Gagliardi
# Install the ite-leds command, udev rule and boot service. Does not touch the
# kernel driver (use install-driver.sh for that).
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run as root: sudo $0" >&2; exit 1; }
USER_NAME=${SUDO_USER:?run it with sudo from your user, not from a root shell}
HERE=$(cd "$(dirname "$0")" && pwd)
USER_HOME=$(getent passwd "$USER_NAME" | cut -d: -f6)
CTL="$USER_HOME/.local/bin/ite8291r3-ctl"
[ -x "$CTL" ] || { echo "missing $CTL (pipx install ite8291r3-ctl)" >&2; exit 1; }

install -m 755 "$HERE/bin/ite-leds" /usr/local/sbin/ite-leds
ln -sf /usr/local/sbin/ite-leds /usr/local/bin/ite-leds

if [ ! -e /etc/ite-leds.conf ]; then
    printf '# managed by ite-leds\nkb_on=1\nkb_rgb=255,255,255\nkb_brightness=\nbar_on=0\nbar_rgb=255,255,255\nbar_brightness=50\n' > /etc/ite-leds.conf
fi
chown "$USER_NAME": /etc/ite-leds.conf
chmod 644 /etc/ite-leds.conf

# Replace the previous udev rule (same USB permissions plus the lightbar LED).
if [ -e /etc/udev/rules.d/99-ite8291.rules ]; then
    mv /etc/udev/rules.d/99-ite8291.rules /etc/udev/rules.d/99-ite8291.rules.bak
fi
install -m 644 "$HERE/udev/99-ite-leds.rules" /etc/udev/rules.d/
udevadm control --reload
udevadm trigger --subsystem-match=usb --subsystem-match=leds --action=add

sed "s|@ITE_CTL@|$CTL|" "$HERE/systemd/ite-leds.service" > /etc/systemd/system/ite-leds.service

# Replace the old service (kept on disk, only disabled).
systemctl disable keyboard-backlight.service 2>/dev/null || true
systemctl daemon-reload
systemctl enable --now ite-leds.service
echo done; ite-leds get
