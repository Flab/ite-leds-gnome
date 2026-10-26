// SPDX-License-Identifier: GPL-2.0-or-later
// Copyright (C) 2026 Fabio Gagliardi
// Thin wrapper around the ite-leds command, shared by the shell and prefs code.
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const CMD = '/usr/local/bin/ite-leds';

export const PRESETS = [
    ['Bianco', '255,255,255'],
    ['Rosso', '255,0,0'],
    ['Arancio', '255,100,0'],
    ['Giallo', '255,200,0'],
    ['Verde', '0,255,0'],
    ['Ciano', '0,255,255'],
    ['Blu', '0,0,255'],
    ['Viola', '160,0,255'],
];

export function rgbToHex(rgb) {
    return '#' + rgb.split(',').map(n => Number(n).toString(16).padStart(2, '0')).join('');
}

function run(argv) {
    return new Promise((resolve, reject) => {
        const proc = Gio.Subprocess.new([CMD, ...argv],
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_SILENCE);
        proc.communicate_utf8_async(null, null, (p, res) => {
            try {
                const [, out] = p.communicate_utf8_finish(res);
                resolve(p.get_successful() ? out : null);
            } catch (e) {
                reject(e);
            }
        });
    });
}

export async function getState() {
    const out = await run(['get']);
    if (out === null)
        return null;
    const state = {};
    for (const line of out.split('\n')) {
        const i = line.indexOf('=');
        if (i > 0)
            state[line.slice(0, i)] = line.slice(i + 1);
    }
    return state;
}

// Commands are chained so a slider drag never runs two ite-leds at once.
let chain = Promise.resolve();
export function setValue(key, value) {
    chain = chain.then(() => run(['set', key, String(value)])).catch(e => log(`ite-leds: ${e}`));
    return chain;
}

export function debounce(fn, ms = 200) {
    let id = 0;
    return (...args) => {
        if (id)
            GLib.source_remove(id);
        id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
            id = 0;
            fn(...args);
            return GLib.SOURCE_REMOVE;
        });
    };
}
