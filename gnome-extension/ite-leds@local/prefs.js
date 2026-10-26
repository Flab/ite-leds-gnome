// SPDX-License-Identifier: GPL-2.0-or-later
// Copyright (C) 2026 Fabio Gagliardi
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {getState, setValue, rgbToHex} from './ledctl.js';

export default class IteLedsPrefs extends ExtensionPreferences {
    async fillPreferencesWindow(window) {
        const state = await getState() ?? {};
        const page = new Adw.PreferencesPage({title: 'ITE LEDs', icon_name: 'preferences-color-symbolic'});
        const group = new Adw.PreferencesGroup({
            title: 'Colori personalizzati',
            description: 'Il colore viene applicato subito e salvato in /etc/ite-leds.conf.',
        });
        for (const [prefix, title] of [['kb', 'Tastiera'], ['bar', 'Striscia LED']]) {
            const row = new Adw.ActionRow({title});
            const rgba = new Gdk.RGBA();
            rgba.parse(rgbToHex(state[`${prefix}_rgb`] ?? '255,255,255'));
            const button = new Gtk.ColorDialogButton({dialog: new Gtk.ColorDialog(), rgba, valign: Gtk.Align.CENTER});
            button.connect('notify::rgba', () => {
                const c = button.rgba;
                const rgb = [c.red, c.green, c.blue].map(v => Math.round(v * 255)).join(',');
                setValue(`${prefix}_rgb`, rgb);
                setValue(`${prefix}_on`, 1);
            });
            row.add_suffix(button);
            group.add(row);
        }
        page.add(group);
        window.add(page);
    }
}
