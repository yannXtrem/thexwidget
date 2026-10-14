import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {suggestCommands, lookupCommand} from '../lib/registry.js';

export const SearchBar = GObject.registerClass({
    Signals: {
        'command-run': {param_types: [GObject.TYPE_STRING]},
    },
}, class SearchBar extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'xwidget-search', false);

        this._extension = extension;
        this._settings = extension.settings;
        this._runner = extension.runner;
        this._history = [];
        this._historyIndex = -1;

        this._box = new St.BoxLayout({
            style_class: 'xwidget-search-box',
            vertical: false,
            reactive: true,
        });

        this._icon = new St.Icon({
            style_class: 'xwidget-search-icon',
            icon_name: 'system-search-symbolic',
            icon_size: 16,
        });

        this._entry = new St.Entry({
            style_class: 'xwidget-search-entry',
            hint_text: 'Commande x… (ex : next, sys)',
            can_focus: true,
            x_expand: true,
            x_align: Clutter.ActorAlign.START,
        });

        this._box.add_child(this._icon);
        this._box.add_child(this._entry);
        this.add_child(this._box);

        this._entry.clutter_text.connect('activate', () => this._onActivate());
        this._entry.clutter_text.connect('key-press-event', (o, e) => this._onKeyPress(o, e));
        this._entry.clutter_text.connect('text-changed', () => this._onTextChanged());

        this._suggestionSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._suggestionSection);
        this.menu.actor.add_style_class_name('xwidget-menu');

        this._resultItem = null;
        this._lastQuery = '';
    }

    _onTextChanged() {
        const text = this._entry.get_text().trim();
        if (!text) {
            this._suggestionSection.removeAll();
            return;
        }
        const suggestions = suggestCommands(text, 6);
        this._suggestionSection.removeAll();
        for (const cmd of suggestions) {
            const item = new PopupMenu.PopupBaseMenuItem({reactive: true});
            const label = new St.Label({
                text: `${cmd.name}  ${cmd.description}`,
                style_class: 'xwidget-suggestion',
            });
            item.add_child(label);
            item.connect('activate', () => {
                this._entry.set_text(cmd.name);
                this._entry.clutter_text.set_cursor_position(-1);
                this.menu.close();
            });
            this._suggestionSection.addMenuItem(item);
        }
    }

    _onKeyPress(o, e) {
        const symbol = e.get_key_symbol();
        if (symbol === Clutter.KEY_Escape) {
            this.menu.close();
            this._entry.set_text('');
            return Clutter.EVENT_STOP;
        }
        if (symbol === Clutter.KEY_Up) {
            this._navigateHistory(-1);
            return Clutter.EVENT_STOP;
        }
        if (symbol === Clutter.KEY_Down) {
            this._navigateHistory(1);
            return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _navigateHistory(dir) {
        if (this._history.length === 0) {
            return;
        }
        this._historyIndex = Math.max(0, Math.min(this._history.length - 1, this._historyIndex + dir));
        this._entry.set_text(this._history[this._historyIndex]);
        this._entry.clutter_text.set_cursor_position(-1);
    }

    _onActivate() {
        const text = this._entry.get_text().trim();
        if (!text) {
            return;
        }
        this._lastQuery = text;
        this._history.unshift(text);
        this._history = this._history.slice(0, 20);
        this._historyIndex = -1;

        const args = text.split(/\s+/);
        const known = lookupCommand(args[0]);
        const cmdArgs = known ? args : args;

        this._showRunning(text);
        this._runner.run(cmdArgs).then((res) => {
            this._showResult(text, res);
        }).catch((e) => {
            this._showResult(text, {ok: false, code: -1, stdout: '', stderr: String(e)});
        });
    }

    _showRunning(text) {
        this._suggestionSection.removeAll();
        if (this._resultItem) {
            this._resultItem.destroy();
            this._resultItem = null;
        }
        const item = new PopupMenu.PopupBaseMenuItem({reactive: false});
        const label = new St.Label({
            text: `x ${text} …`,
            style_class: 'xwidget-result-running',
        });
        item.add_child(label);
        this.menu.addMenuItem(item);
        this._resultItem = item;
        this.menu.open();
    }

    _showResult(text, res) {
        if (this._resultItem) {
            this._resultItem.destroy();
            this._resultItem = null;
        }
        this._suggestionSection.removeAll();

        const item = new PopupMenu.PopupBaseMenuItem({reactive: false});
        const box = new St.BoxLayout({vertical: true, style_class: 'xwidget-result-box'});

        const header = new St.Label({
            text: `x ${text}`,
            style_class: 'xwidget-result-header',
        });
        box.add_child(header);

        const body = new St.Label({
            text: res.stdout || res.stderr || '(aucune sortie)',
            style_class: 'xwidget-result-body',
            x_expand: true,
        });
        body.clutter_text.line_wrap = true;
        body.clutter_text.ellipsize = 0;
        box.add_child(body);

        const footer = new St.Label({
            text: res.ok ? `code ${res.code}` : `erreur (code ${res.code})`,
            style_class: 'xwidget-result-footer',
        });
        box.add_child(footer);

        item.add_child(box);
        this.menu.addMenuItem(item);
        this._resultItem = item;
        this.menu.open();
    }

    destroy() {
        this._history = [];
        super.destroy();
    }
});
