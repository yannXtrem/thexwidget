import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import {XRunner} from './xcli.js';

export const Dashboard = GObject.registerClass({
    Signals: {
        'updated': {param_types: [GObject.TYPE_BOOLEAN]},
    },
}, class Dashboard extends GObject.Object {
    _init(settings) {
        super._init();
        this._settings = settings;
        this._runner = new XRunner(settings);
        this._timeoutId = 0;
        this._last = null;
        this._source = 'status';
        this._refreshing = false;
        this._dead = false;
    }

    get last() {
        return this._last;
    }

    get source() {
        return this._source;
    }

    start() {
        if (this._timeoutId) {
            return;
        }
        this._dead = false;
        this.refresh();
        const seconds = this._settings ? this._settings.get_int('refresh-seconds') : 30;
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, Math.max(10, seconds), () => {
            this.refresh();
            return GLib.SOURCE_CONTINUE;
        });
    }

    stop() {
        this._dead = true;
        this._refreshing = false;
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        this._runner.cancel();
    }

    refresh() {
        if (this._refreshing || this._dead) {
            return;
        }
        this._refreshing = true;
        this._runner.runJson(['status'])
            .then((r) => {
                this._refreshing = false;
                if (this._dead) {
                    return;
                }
                if (r.ok && r.data && r.data.status === 'success') {
                    this._source = 'status';
                    this._last = this._normalize(r.data);
                    this.emit('updated', true);
                } else {
                    this._applyFallback();
                }
            })
            .catch(() => {
                this._refreshing = false;
                if (this._dead) {
                    return;
                }
                this._applyFallback();
            });
    }

    _applyFallback() {
        this._fallback()
            .catch(() => {})
            .then(() => {
                if (!this._dead) {
                    this.emit('updated', true);
                }
            });
    }

    async _fallback() {
        const [next, sys, bat] = await Promise.all([
            this._runJson(['next']),
            this._runText(['sys']),
            this._runText(['bat']),
        ]);

        const out = {
            generatedAt: new Date().toISOString(),
            host: {}, cpu: {}, mem: {}, disks: [], net: {},
            battery: {}, vpn: {}, top: [], course: null, bus: [], memos: [],
        };

        if (next && next.status === 'success') {
            out.course = next.course && next.course.found ? {
                subject: next.course.subject || '',
                room: next.course.door || '',
                start: next.course.start || '',
                end: next.course.end || '',
                inMinutes: next.course.in_minutes ?? 0,
                inProgress: !!next.course.in_progress,
                weekday: next.course.weekday || '',
                date: next.course.date || '',
            } : null;
            out.bus = Array.isArray(next.bus?.departures) ? next.bus.departures : [];
            out.memos = Array.isArray(next.memo?.memos) ? next.memo.memos : [];
        }

        if (sys) {
            const mem = sys.match(/\[MEM\]\s*RAM\s*:\s*(\d+)M\s*\/\s*(\d+)M/);
            if (mem) {
                out.mem = {
                    used_mb: parseInt(mem[1], 10),
                    total_mb: parseInt(mem[2], 10),
                    percent: Math.round(parseInt(mem[1], 10) * 100 / Math.max(1, parseInt(mem[2], 10))),
                };
            }
            const cpu = sys.match(/\[\*\]\s*CPU\s*:\s*(.*?)\|\s*Charge\s*:\s*([\d.]+)/);
            if (cpu) {
                out.cpu = {model: cpu[1].trim(), load: [parseFloat(cpu[2])], percent: 0};
            }
        }

        if (bat) {
            const pct = bat.match(/\[\*\]\s*Niveau\s*:\s*\[[^\]]*\]\s*(\d+)%/);
            const status = bat.match(/\[\*\]\s*Alimentation:\s*([^\|]+)\|\s*Statut\s*:\s*([^\n]+)/);
            out.battery = {
                present: true,
                percent: pct ? parseInt(pct[1], 10) : 0,
                status: status ? status[2].trim() : '',
                on_ac: status ? status[1].includes('Secteur') : false,
                health_percent: -1,
                power_w: 0,
                time_left: '',
            };
        }

        this._source = 'fallback';
        this._last = out;
    }

    _runText(args) {
        return this._runner.run(args).then((r) => (r.ok ? r.stdout : ''));
    }

    _runJson(args) {
        return this._runner.runJson(args);
    }

    _normalize(d) {
        const next = d.next || {};
        const course = next.course || null;
        const bus = next.bus || {};
        const memo = next.memo || {};

        return {
            generatedAt: d.generated_at || '',
            host: d.host || {},
            cpu: d.cpu || {},
            mem: d.mem || {},
            disks: d.disks || [],
            net: d.net || {},
            battery: d.battery || {},
            vpn: d.vpn || {},
            top: d.top || [],
            course: course && course.found ? {
                subject: course.subject || '',
                room: course.door || '',
                start: course.start || '',
                end: course.end || '',
                inMinutes: course.in_minutes ?? 0,
                inProgress: !!course.in_progress,
                weekday: course.weekday || '',
                date: course.date || '',
            } : null,
            bus: Array.isArray(bus.departures) ? bus.departures.map((b) => ({
                bus: String(b.bus ?? ''),
                time: b.time || '',
                stop: b.stop || '',
                to: b.to || '',
                inMinutes: b.in_minutes ?? 0,
            })) : [],
            memos: Array.isArray(memo.memos) ? memo.memos.map((m) => ({
                title: m.title || '',
                subject: m.subject || '',
                due: m.due || '',
                overdue: !!m.overdue,
            })) : [],
        };
    }
});
