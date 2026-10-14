import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export const DesktopWidget = GObject.registerClass({
    Signals: {},
}, class DesktopWidget extends St.BoxLayout {
    _init(runner, dashboard, settings) {
        super._init({
            style_class: 'xwidget-desktop',
            vertical: true,
            reactive: true,
            track_hover: true,
        });

        this._runner = runner;
        this._dashboard = dashboard;
        this._settings = settings;
        this._clockTimeout = 0;

        this._buildUI();

        if (this._dashboard) {
            this._dashboard.connect('updated', () => this._refresh());
        }
        this._refresh();
        this._tick();

        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            if (this.get_parent()) {
                this._placeOnDesktop();
            }
            return GLib.SOURCE_REMOVE;
        });
    }

    _buildUI() {
        this._clockLabel = new St.Label({ style_class: 'xwidget-desktop-clock' });
        this._dateLabel = new St.Label({ style_class: 'xwidget-desktop-date' });
        this._courseLabel = new St.Label({ style_class: 'xwidget-desktop-line' });
        this._busLabel = new St.Label({ style_class: 'xwidget-desktop-line' });
        this._memoLabel = new St.Label({ style_class: 'xwidget-desktop-line' });

        this._cpuBar = this._makeBar();
        this._ramBar = this._makeBar();
        this._batBar = this._makeBar();

        this.add_child(this._clockLabel);
        this.add_child(this._dateLabel);
        this.add_child(this._courseLabel);
        this.add_child(this._busLabel);
        this.add_child(this._memoLabel);
        this.add_child(this._cpuBar.box);
        this.add_child(this._ramBar.box);
        this.add_child(this._batBar.box);

        this.connect('notify::size', () => this._placeOnDesktop());
    }

    _makeBar() {
        const box = new St.BoxLayout({ style_class: 'xwidget-desktop-bar-row' });
        const key = new St.Label({ text: '', style_class: 'xwidget-desktop-bar-key' });
        const bar = new St.Widget({
            style_class: 'xwidget-desktop-bar',
            x_expand: true,
        });
        const fill = new St.Widget({ style_class: 'xwidget-desktop-bar-fill' });
        bar.add_child(fill);
        const val = new St.Label({ text: '', style_class: 'xwidget-desktop-bar-val' });
        box.add_child(key);
        box.add_child(bar);
        box.add_child(val);
        return { box, key, bar, fill, val };
    }

    _setBar(item, key, percent, text) {
        item.key.text = key;
        item.val.text = text;
        const width = Math.max(0, Math.min(100, percent));
        item.fill.set_width(Math.round(width * 1.2));
        item.fill.style = `background-color: ${this._barColor(width)};`;
    }

    _barColor(percent) {
        if (percent >= 85) return '#e01b24';
        if (percent >= 70) return '#e66100';
        return '#33d17a';
    }

    _placeOnDesktop() {
        const corner = this._settings ? this._settings.get_string('desktop-corner') : 'bottom-right';
        const opacity = this._settings ? this._settings.get_double('desktop-opacity') : 0.85;
        this.opacity = Math.round(Math.max(0, Math.min(1, opacity)) * 255);

        const monitor = Main.layoutManager.primaryMonitor;
        if (!monitor) return;

        const [, , natW, natH] = this.get_preferred_size();
        const w = natW > 0 ? natW : 320;
        const h = natH > 0 ? natH : 200;

        const margin = 20;
        const dash = Main.overview?.dash ?? null;
        const dockH = dash && dash.visible ? dash.height : 0;
        const bottomMargin = margin + dockH + 8;

        let x = monitor.x + monitor.width - w - margin;
        let y = monitor.y + monitor.height - h - bottomMargin;

        if (corner.includes('left')) x = monitor.x + margin;
        if (corner.includes('top')) y = monitor.y + margin;

        this.set_position(Math.round(x), Math.round(y));
    }

    _tick() {
        if (this._clockTimeout) {
            GLib.source_remove(this._clockTimeout);
            this._clockTimeout = 0;
        }
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        this._clockLabel.text = `${ hh }:${ mm }:${ ss }`;
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
        this._dateLabel.text = `${ days[now.getDay()] } ${ now.getDate() } ${ months[now.getMonth()] } ${ now.getFullYear() }`;
        this._clockTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._tick();
            return GLib.SOURCE_REMOVE;
        });
    }
    _refresh() {
        const d = this._dashboard ? this._dashboard.last : null;
        if (!d) return;
        if (d.course) {
            const c = d.course;
            const when = c.inProgress ? 'en cours' : `dans ${ c.inMinutes } min`;
            this._courseLabel.text = `COURS  ${ c.start } -${ c.end } ${ c.subject } (${ when })`;
    } else {
    this._courseLabel.text = 'COURS  aucun cours à venir';
}
if (d.bus && d.bus.length > 0) {
    const b = d.bus[0];
    const to = b.to ? ` → ${ b.to }`: '';
    this._busLabel.text = `BUS    ${ b.bus } · ${ b.time } · ${ b.stop }${ to } (dans ${ b.inMinutes } min)`;
} else {
    this._busLabel.text = 'BUS    aucun départ';
}
this._memoLabel.text = `DEVOIRS  ${ d.memos ? d.memos.length : 0 } à rendre`;
this._setBar(this._cpuBar, 'CPU', d.cpu?.percent ?? 0, `${ d.cpu?.percent ?? '-' } %`);
this._setBar(this._ramBar, 'RAM', d.mem?.percent ?? 0, `${ d.mem?.used_mb ?? '-' }M / ${ d.mem?.total_mb ?? '-' }M`);
this._setBar(this._batBar, 'BAT', d.battery?.present ? d.battery.percent : 0, d.battery?.present ? `${ d.battery.percent } %` : 'N/A');
}
destroy() {
    if (this._clockTimeout) {
        GLib.source_remove(this._clockTimeout);
        this._clockTimeout = 0;
    }
    super.destroy();
}
});