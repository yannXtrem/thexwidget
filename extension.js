import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import {XRunner} from './lib/xcli.js';
import {Dashboard} from './lib/dashboard.js';
import {SearchBar} from './ui/searchBar.js';
import {StatusButton} from './ui/statusButton.js';
import {DesktopWidget} from './ui/desktopWidget.js';

export default class XWidgetExtension extends Extension {
    enable() {
        this._settings = this.getSettings('org.gnome.shell.extensions.thexwidget');
        this._runner = new XRunner(this._settings);
        this._dashboard = new Dashboard(this._settings);

        this._settings.connect('changed::x-path', () => {
            this._runner.xPath = this._settings.get_string('x-path');
        });
        this._settings.connect('changed::max-output-lines', () => {
            this._runner.maxLines = this._settings.get_int('max-output-lines');
        });

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
        if (this._statusButton) {
            this._statusButton.destroy();
            this._statusButton = null;
        }
        if (this._searchBar) {
            this._searchBar.destroy();
            this._searchBar = null;
        }

        this._settings = null;
    }

    _createUI() {
        const showSearch = this._settings.get_boolean('show-search-bar');
        const showStatus = this._settings.get_boolean('show-panel-status');
        const showDesktop = this._settings.get_boolean('show-desktop-widget');

        if (showSearch) {
            this._searchBar = new SearchBar(this);
            this._searchBar.connect('command-run', (_s, cmd) => {
                this._runCommand(cmd);
            });
            Main.panel.addToStatusArea('xwidget-search', this._searchBar, 0, 'center');
        }

        if (showStatus) {
            this._statusButton = new StatusButton(this);
            this._statusButton.connect('command-run', (_s, cmd) => {
                this._runCommand(cmd);
            });
            Main.panel.addToStatusArea('xwidget-status', this._statusButton, 10, 'right');
        }

        if (showDesktop) {
            this._desktopWidget = new DesktopWidget(this);
            const bg = Main.layoutManager._backgroundGroup || Main.uiGroup;
            bg.add_child(this._desktopWidget);
        }

        this._settings.connect('changed::show-search-bar', () => this._reloadUI());
        this._settings.connect('changed::show-panel-status', () => this._reloadUI());
        this._settings.connect('changed::show-desktop-widget', () => this._reloadUI());
        this._settings.connect('changed::desktop-corner', () => {
            if (this._desktopWidget) {
                this._desktopWidget._placeOnDesktop();
            }
        });
        this._settings.connect('changed::desktop-opacity', () => {
            if (this._desktopWidget) {
                this._desktopWidget._placeOnDesktop();
            }
        });
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
        if (this._searchBar) {
            Main.panel.statusArea['xwidget-search']?.menu?.close?.();
            this._searchBar.grab_key_focus();
        }
    }

    _reloadUI() {
        this.disable();
        this.enable();
    }
}
