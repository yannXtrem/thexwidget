import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {quickCommands, CATEGORIES} from '../lib/registry.js';

export const StatusButton = GObject.registerClass({
    Signals: {
        'command-run': {param_types: [GObject.TYPE_STRING]},
    },
}, class StatusButton extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'xwidget-status', false);

        this._extension = extension;
        this._settings = extension.settings;
        this._runner = extension.runner;
        this._dashboard = extension.dashboard;

        this._label = new St.Label({
            text: 'x',
            style_class: 'xwidget-status-label',
        });
        this.add_child(this._label);

        this.menu.actor.add_style_class_name('xwidget-menu');

        this._buildMenu();

        if (this._dashboard) {
            this._dashboard.connect('updated', () => this._refresh());
        }
        this._refresh();
    }

    _buildMenu() {
        this._dashSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._dashSection);

        this._sysSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._sysSection);

        this._quickSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._quickSection);

        this._resultSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._resultSection);

        for (const cmd of quickCommands()) {
            const item = new PopupMenu.PopupBaseMenuItem({reactive: true});
            const label = new St.Label({
                text: `${cmd.name}  ${cmd.description}`,
                style_class: 'xwidget-quick-item',
            });
            item.add_child(label);
            item.connect('activate', () => {
                this.emit('command-run', cmd.name);
                this._runQuick(cmd.name);
            });
            this._quickSection.addMenuItem(item);
        }
    }

    _runQuick(name) {
        this._runner.run([name]).then((res) => {
            this._showResult(name, res);
        }).catch((e) => {
            this._showResult(name, {ok: false, code: -1, stdout: '', stderr: String(e)});
        });
    }

    _showResult(name, res) {
        this._resultSection.removeAll();
        const item = new PopupMenu.PopupBaseMenuItem({reactive: false});
        const box = new St.BoxLayout({vertical: true, style_class: 'xwidget-result-box'});
        box.add_child(new St.Label({text: `x ${name}`, style_class: 'xwidget-result-header'}));
        const body = new St.Label({
            text: res.stdout || res.stderr || '(aucune sortie)',
            style_class: 'xwidget-result-body',
            x_expand: true,
        });
        body.clutter_text.line_wrap = true;
        body.clutter_text.ellipsize = 0;
        box.add_child(body);
        box.add_child(new St.Label({
            text: res.ok ? `code ${res.code}` : `erreur (code ${res.code})`,
            style_class: 'xwidget-result-footer',
        }));
        item.add_child(box);
        this._resultSection.addMenuItem(item);
        this.menu.open();
    }

    _refresh() {
        const d = this._dashboard ? this._dashboard.last : null;
        if (!d) {
            this._label.text = 'x';
            this._dashSection.removeAll();
            this._sysSection.removeAll();
            return;
        }

        const course = d.course;
        if (course) {
            const when = course.inProgress ? 'en cours' : `dans ${course.inMinutes} min`;
            this._label.text = `${course.start} ${when}`;
        } else if (d.battery && d.battery.present) {
            this._label.text = `BAT ${d.battery.percent}%`;
        } else {
            this._label.text = 'x';
        }

        this._dashSection.removeAll();
        this._dashSection.addMenuItem(this._row('COURS', this._courseText(d)));
        this._dashSection.addMenuItem(this._row('BUS', this._busText(d)));
        this._dashSection.addMenuItem(this._row('MEMO', this._memoText(d)));

        this._sysSection.removeAll();
        const cpu = d.cpu || {};
        const mem = d.mem || {};
        this._sysSection.addMenuItem(this._row('CPU', `${cpu.percent ?? '-'}%`));
        this._sysSection.addMenuItem(this._row('RAM', `${mem.used_mb ?? '-'}M/${mem.total_mb ?? '-'}M (${mem.percent ?? '-'}%)`));
        for (const disk of d.disks || []) {
            this._sysSection.addMenuItem(this._row('DISK', `${disk.mount} ${disk.percent}%`));
        }
        const bat = d.battery || {};
        if (bat.present) {
            this._sysSection.addMenuItem(this._row('BAT', `${bat.percent}% ${bat.on_ac ? '(secteur)' : ''}`));
        }
        const net = d.net || {};
        this._sysSection.addMenuItem(this._row('NET', (net.local_ips || []).join(' ') || 'Non connecté'));
        const vpn = d.vpn || {};
        this._sysSection.addMenuItem(this._row('VPN', vpn.active ? (vpn.interfaces || []).join(',') : 'aucun tunnel'));
    }

    _row(key, value) {
        const item = new PopupMenu.PopupBaseMenuItem({reactive: false});
        const box = new St.BoxLayout({style_class: 'xwidget-dash-row'});
        box.add_child(new St.Label({text: key, style_class: 'xwidget-dash-key'}));
        const val = new St.Label({text: value, style_class: 'xwidget-dash-val', x_expand: true});
        val.clutter_text.ellipsize = 2;
        val.clutter_text.line_wrap = false;
        box.add_child(val);
        item.add_child(box);
        return item;
    }

    _courseText(d) {
        if (!d.course) {
            return 'aucun cours à venir';
        }
        const c = d.course;
        const room = c.room ? ` [${c.room}]` : '';
        const when = c.inProgress ? 'en cours' : `dans ${c.inMinutes} min`;
        return `${c.weekday} ${c.start}-${c.end} ${c.subject}${room} (${when})`;
    }

    _busText(d) {
        if (!d.bus || d.bus.length === 0) {
            return 'aucun départ';
        }
        const b = d.bus[0];
        const to = b.to ? ` → ${b.to}` : '';
        return `Bus ${b.bus} à ${b.time} · ${b.stop}${to} (dans ${b.inMinutes} min)`;
    }

    _memoText(d) {
        if (!d.memos || d.memos.length === 0) {
            return 'aucun devoir à rendre';
        }
        return `${d.memos.length} devoir(s) à rendre`;
    }

    destroy() {
        super.destroy();
    }
});
