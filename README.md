# ite-leds-gnome

Control of the **RGB keyboard backlight** and the **chassis LED stripe**
(lightbar) of Uniwill/Clevo-based notebooks that use ITE lighting controllers,
from the GNOME Quick Settings panel and from a small command line tool.

It packages three things:

- a minimal DKMS build of TUXEDO's `ite_8291_lb` kernel driver (the lightbar
  LED), without the rest of `tuxedo-drivers`;
- `ite-leds`, a command plus a boot service that apply a saved state
  (on/off, colour, brightness) to the keyboard and the lightbar;
- a GNOME Shell extension with two Quick Settings toggles that use it.

## Sources

Everything in this project that is not original comes from the sources below.
Each was read on 2026-10-26 and is cited only for what it actually says.

1. **`tuxedo-drivers`**, TUXEDO Computers GmbH. Source of `driver/ite_8291_lb.c`,
   the kernel driver for the ITE lightbar, copied **without changes** (see
   `driver/UPSTREAM.md` for the exact file and its sha256). Its README lists
   `ite_8291_lb` among the modules, and its license file gives GPL-2.0+.
   <https://gitlab.com/tuxedocomputers/development/packages/tuxedo-drivers>
   <https://gitlab.com/tuxedocomputers/development/packages/tuxedo-drivers/-/raw/main/src/ite_8291_lb/ite_8291_lb.c>
2. **`ite8291r3-ctl`**, Barnabás Pőcze, GPL-2.0. A userspace tool for the
   ITE 8291 keyboard controller. Its README lists the USB product IDs
   `6004`, `6006`, `600b` and `ce00` (vendor `048d`), the `--device
   <bus>/<addr>` option, and the udev rule file name `99-ite8291.rules` for
   running it without root. `ite-leds` calls this tool for the keyboard; it
   is not included here.
   <https://github.com/pobrn/ite8291r3-ctl>

Facts about the test machine come from the machine itself, not from the web:
`lsusb` (`048d:600b` keyboard controller, `048d:7001` lightbar controller),
`/sys/class/leds/rgb:lightbar` created by the driver, DMI board `X6AR559Y`
(vendor `AiStone`), Ubuntu with kernel 7.0.0-38 and GNOME Shell 50.1.

## Status

**Experimental.** Written and tested on one machine only: AiStone `X6AR559Y`
(Uniwill X6 chassis), Ubuntu, kernel 7.0.0-38, GNOME Shell 50.1 on Wayland.
The extension declares support for GNOME Shell 50 only, because that is the
only version it has been run on. Other notebooks with the same USB IDs may
work, but nothing here has been checked on them.

This project is not affiliated with, endorsed by or supported by TUXEDO
Computers, ITE or the notebook vendors. Their names are used only to say where
code comes from and which hardware it talks to. Do not report problems with
this repository to TUXEDO: the kernel driver file is theirs and unchanged,
everything else is not.

**Do not install it together with `tuxedo-drivers`.** Both provide the
`ite_8291_lb` module. Use one or the other.

## Origin and credits

This is a derivative work of GPL code, so it is GPL-2.0-or-later (the
`tuxedo-drivers` file is GPL-2.0+, `ite8291r3-ctl` is GPL-2.0).

**Taken from other people's work**

- The kernel driver for the lightbar: `ite_8291_lb.c` by TUXEDO Computers
  (source 1), unmodified. Using a current copy matters because it knows how to
  switch the `7001` lightbar on and off, which older snapshots did not.
- The keyboard control: `ite8291r3-ctl` by Barnabás Pőcze (source 2), called
  as an external command.

**Done here**

- Taking only the `ite_8291_lb` file out of `tuxedo-drivers`, with a DKMS
  packaging (`driver/Kbuild`, `Makefile`, `dkms.conf`), so the full TUXEDO
  driver set (which can conflict with a distribution kernel) is not needed.
- `ite-leds`: one saved state in `/etc/ite-leds.conf`, applied to both
  devices, and the systemd service that applies it at boot.
- The udev rule that lets the user control the devices without root.
- The GNOME Shell extension.

If you are one of the authors above and want a credit changed or the project
removed, please open an issue.

## What it does

- **Kernel driver (`driver/`)**: creates the LED class device
  `/sys/class/leds/rgb:lightbar` (`brightness`, `multi_intensity`) for the
  `048d:7001` lightbar controller.
- **`ite-leds`**: keeps the state in `/etc/ite-leds.conf` and applies it.
  - `ite-leds get`: print the state.
  - `ite-leds set KEY VALUE`: save one value and apply it.
  - `ite-leds apply`: apply the saved state (this is what the service runs).
  - Keys: `kb_on`, `kb_rgb`, `kb_brightness` (0 to 50, empty keeps the
    controller value), `bar_on`, `bar_rgb`, `bar_brightness` (0 to 100).
    Colours are written as `R,G,B`, for example `255,100,0`.
- **Boot service (`ite-leds.service`)**: applies the saved state once the
  driver is loaded, before the display manager.
- **GNOME extension (`gnome-extension/`)**: two Quick Settings toggles,
  **Tastiera** and **Striscia LED**, each with a menu of 8 preset colours and
  a brightness slider. Custom colours are in the extension preferences
  (`gnome-extensions prefs ite-leds@local`). Labels are in Italian.

## Known limitations

- **Colours at power-on.** The controllers start with their firmware default
  (a rainbow effect) and the saved colour is applied only when the service
  runs, a few seconds into the boot. Before that, during firmware and
  bootloader, the default shows. It cannot be avoided from Linux alone. The
  keyboard controller has a `--save` option in `ite8291r3-ctl` that stores
  a setting inside the controller: this project does **not** use it, and it
  has not been tested here. For the lightbar no equivalent was found.
- The controller reports brightness `0` through `ite8291r3-ctl query` even
  when the keyboard is lit, so `ite-leds` does not read the brightness back
  and keeps its own value.
- The state is not re-applied after suspend by a dedicated hook.
- Labels in the extension are Italian only.

## Safety

- Everything is a runtime command to the lighting controllers. No firmware or
  BIOS is flashed. This project does not use the controllers' save option.
  For the lightbar it was not checked whether the driver's commands are kept
  by the controller after a power cycle.
- `/etc/ite-leds.conf` is owned by the user who ran the installer, so the
  extension can write it without root. The boot service runs as root but only
  reads it through strict validation: each line must be a known key with a
  value of the expected shape. Nothing in the file is executed or used as a
  path.
- The udev rule (`99-ite-leds.rules`) makes the two USB controllers
  (`048d:600b`, `048d:7001`) and the lightbar `brightness` and
  `multi_intensity` files writable by every local user (mode `0666`). On a
  multi-user machine, adapt it to a group.
- With Secure Boot, DKMS signs the module with your MOK key, so that key
  must already be enrolled. An unsigned module is rejected, often without a
  clear message.

## Requirements

- Linux with kernel headers (`linux-headers-$(uname -r)`), `dkms`,
  `build-essential`, `usbutils` (for `lsusb`) and Python 3.
- `ite8291r3-ctl`, installed for your user: `pipx install ite8291r3-ctl`.
- GNOME Shell 50 for the extension.

## Install

Run each step in a normal terminal, from the repository folder.

    sudo ./install-driver.sh      # DKMS build of ite_8291_lb 1.1.0 and reload
    sudo ./install.sh             # ite-leds, udev rule, boot service
    ./install-extension.sh        # GNOME extension, as your user

The driver script prints the loaded module path and checks that
`rgb:lightbar` exists. The installer replaces an existing
`keyboard-backlight.service` and `99-ite8291.rules` by disabling or renaming
them, not deleting them.

On Wayland, log out and in once, then enable the extension:

    gnome-extensions enable ite-leds@local

Quick test without the panel:

    ite-leds set bar_rgb 255,0,0
    ite-leds set bar_on 1
    ite-leds set bar_on 0

## Uninstall

    sudo ./uninstall.sh           # service, command and udev rule
    sudo ./uninstall-driver.sh    # the DKMS driver
    gnome-extensions disable ite-leds@local
    rm -r ~/.local/share/gnome-shell/extensions/ite-leds@local

`uninstall.sh` re-enables a previous `keyboard-backlight.service` if it finds
one and keeps `/etc/ite-leds.conf`.

## Reporting

Please open an issue with `lsusb | grep 048d`, `cat /sys/class/dmi/id/{sys_vendor,board_name}`,
your kernel and GNOME Shell versions, `dmesg | grep ite_8291` and what you
saw on the keyboard and the lightbar.

## License

GPL-2.0-or-later. See `LICENSE`. `driver/ite_8291_lb.c` keeps its own header
(GPL-2.0+, TUXEDO Computers GmbH).
