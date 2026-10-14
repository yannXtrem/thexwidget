import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import {XRunner} from './lib/xcli.js';
import {Dashboard} from './lib/dashboard.js';
import {DesktopWidget} from './ui/desktopWidget.js';

export default class XWidgetExtension extends Extension {
    enable() {
        this._settings = this.getSettings('org.gnome.shell.extensions.thexwidget');
        this._runner = new XRunner(this._settings);
        this._dashboard = new Dashboard(this._settings);
        this._settingsHandlers = [];
        this._keybindingAdded = false;

        this._settingsHandlers.push(
            this._settings.connect('changed::x-path', () => {
                this._runner.xPath = this._settings.get_string('x-path');
            })
        );
        this._settingsHandlers.push(
            this._settings.connect('changed::max-output-lines', () => {
                this._runner.maxLines = this._settings.get_int('max-output-lines');
            })
        );

        this._createUI();
        this._dashboard.start();
        this._setupKeybinding();
    }

    disable() {
        this._removeKeybinding();

        if (this._dashboard) {
            this._dashboard.stop();
            this._dashboard = null;
        }
        if (this._runner) {
            this._runner.cancel();
            this._runner = null;
        }
        if (this._desktopWidget) {
            this._desktopWidget.destroy();
            this._desktopWidget = null;
        }

        if (this._settings && this._settingsHandlers) {
            for (const id of this._settingsHandlers) {
                this._settings.disconnect(id);
            }
            this._settingsHandlers = [];
        }

        this._settings = null;
    }

    _createUI() {
        const showDesktop = this._settings.get_boolean('show-desktop-widget');

        if (showDesktop) {
            this._desktopWidget = new DesktopWidget(this._runner, this._dashboard, this._settings);
            const bg = Main.layoutManager._backgroundGroup || Main.uiGroup;
            bg.add_child(this._desktopWidget);
        }

        this._settingsHandlers.push(
            this._settings.connect('changed::show-desktop-widget', () => this._reloadUI())
        );
        this._settingsHandlers.push(
            this._settings.connect('changed::desktop-corner', () => {
                if (this._desktopWidget) {
                    this._desktopWidget._placeOnDesktop();
                }
            })
        );
        this._settingsHandlers.push(
            this._settings.connect('changed::desktop-opacity', () => {
                if (this._desktopWidget) {
                    this._desktopWidget._placeOnDesktop();
                }
            })
        );
    }

    _runCommand(cmd) {
        this._runner.run([cmd]).then(() => {
            this._dashboard.refresh();
        }).catch(() => {});
    }

    _setupKeybinding() {
        const binding = this._settings.get_strv('focus-search');
        if (!binding || binding.length === 0) {
            return;
        }
        try {
            Main.wm.addKeybinding(
                'focus-search',
                this._settings,
                Meta.KeyBindingFlags.NONE,
                Meta.KeyBindingMode.ALL,
                () => this._focusSearch()
            );
            this._keybindingAdded = true;
        } catch (e) {
            console.error('[thexwidget] keybinding failed:', e);
        }
    }

    _removeKeybinding() {
        if (this._keybindingAdded) {
            try {
                Main.wm.removeKeybinding('focus-search');
            } catch (e) {}
            this._keybindingAdded = false;
        }
    }

    _focusSearch() {
        if (this._desktopWidget?.focusSearchEntry) {
            this._desktopWidget.focusSearchEntry();
        }
    }

    _reloadUI() {
        this.disable();
        this.enable();
    }
}