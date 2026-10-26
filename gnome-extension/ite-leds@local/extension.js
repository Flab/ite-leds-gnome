// SPDX-License-Identifier: GPL-2.0-or-later
// Copyright (C) 2026 Fabio Gagliardi
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import {Slider} from 'resource:///org/gnome/shell/ui/slider.js';

import {PRESETS, getState, setValue, debounce, rgbToHex} from './ledctl.js';

// prefix: key prefix in ite-leds ("kb" or "bar"), max: brightness range.
const LedToggle = GObject.registerClass(
class LedToggle extends QuickSettings.QuickMenuToggle {
    _init(title, iconName, prefix, max) {
        super._init({title, iconName, toggleMode: true});
        this._prefix = prefix;
        this._max = max;
        this._busy = false;

        this.menu.setHeader(iconName, title, 'Colore e luminosità');

        const swatches = new St.BoxLayout({style: 'spacing: 8px;', x_align: Clutter.ActorAlign.CENTER});
        for (const [name, rgb] of PRESETS) {
            const btn = new St.Button({
                accessible_name: name,
                style: `background-color: ${rgbToHex(rgb)}; border-radius: 12px; width: 24px; height: 24px; border: 1px solid rgba(128,128,128,0.6);`,
                can_focus: true,
            });
            btn.connect('clicked', () => {
                this._setOn(true);
                setValue(`${prefix}_rgb`, rgb);
            });
            swatches.add_child(btn);
        }
        const swatchItem = new PopupMenu.PopupBaseMenuItem({reactive: false, can_focus: false});
        swatchItem.add_child(swatches);
        this.menu.addMenuItem(swatchItem);

        this._slider = new Slider(0.5);
        this._sendBrightness = debounce(v => setValue(`${prefix}_brightness`, Math.round(v * max)));
        this._slider.connect('notify::value', () => {
            if (!this._busy)
                this._sendBrightness(this._slider.value);
        });
        const sliderItem = new PopupMenu.PopupBaseMenuItem({activate: false});
        sliderItem.add_child(new St.Icon({icon_name: 'display-brightness-symbolic', style_class: 'popup-menu-icon'}));
        sliderItem.add_child(this._slider);
        this.menu.addMenuItem(sliderItem);

        this.connect('notify::checked', () => {
            if (!this._busy)
                setValue(`${prefix}_on`, this.checked ? 1 : 0);
        });
    }

    _setOn(on) {
        this._busy = true;
        this.checked = on;
        this._busy = false;
        setValue(`${this._prefix}_on`, on ? 1 : 0);
    }

    refresh(state) {
        this._busy = true;
        this.checked = state[`${this._prefix}_on`] === '1';
        const b = state[`${this._prefix}_brightness`];
        this._slider.value = b === '' || b === undefined ? 0.5 : Number(b) / this._max;
        this._busy = false;
    }
});

const LedIndicator = GObject.registerClass(
class LedIndicator extends QuickSettings.SystemIndicator {
    _init() {
        super._init();
        this._kb = new LedToggle('Tastiera', 'input-keyboard-symbolic', 'kb', 50);
        this._bar = new LedToggle('Striscia LED', 'weather-clear-symbolic', 'bar', 100);
        this.quickSettingsItems.push(this._kb, this._bar);
    }

    async refresh() {
        const state = await getState();
        if (!state)
            return;
        this._kb.refresh(state);
        this._bar.refresh(state);
    }
});

export default class IteLedsExtension extends Extension {
    enable() {
        this._indicator = new LedIndicator();
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
        this._indicator.refresh();
        // Refresh when the menu opens, in case the state was changed from a terminal.
        this._open = Main.panel.statusArea.quickSettings.menu.connect('open-state-changed',
            (_m, open) => open && this._indicator.refresh());
    }

    disable() {
        Main.panel.statusArea.quickSettings.menu.disconnect(this._open);
        this._indicator.quickSettingsItems.forEach(i => i.destroy());
        this._indicator.destroy();
        this._indicator = null;
    }
}
