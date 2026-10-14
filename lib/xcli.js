import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

const DEFAULT_X_PATH = '/home/yannxtrem/Bureau/yannxtrem/bin/x';

export class XRunner {
    constructor(settings) {
        this._settings = settings;
        this._xPath = DEFAULT_X_PATH;
        this._maxLines = 200;
        this._home = GLib.get_home_dir();
        this._cancellable = null;

        if (settings) {
            this._xPath = settings.get_string('x-path') || DEFAULT_X_PATH;
            this._maxLines = settings.get_int('max-output-lines') || 200;
        }
    }

    set xPath(path) {
        this._xPath = path || DEFAULT_X_PATH;
    }

    get xPath() {
        return this._xPath;
    }

    set maxLines(n) {
        this._maxLines = n > 0 ? n : 200;
    }

    _truncate(text) {
        if (!text) {
            return '';
        }
        const lines = text.split('\n');
        if (lines.length <= this._maxLines) {
            return text;
        }
        const kept = lines.slice(0, this._maxLines);
        return kept.join('\n') + `\n… (${lines.length - this._maxLines} lignes masquées)`;
    }

    run(args, {stdin = null} = {}) {
        return new Promise((resolve) => {
            let proc;
            try {
                const argv = [this._xPath, ...args];
                proc = new Gio.Subprocess({
                    argv,
                    flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
                });
                proc.init(null);
            } catch (e) {
                resolve({ok: false, code: -1, stdout: '', stderr: String(e)});
                return;
            }

            this._cancellable = new Gio.Cancellable();
            proc.communicate_utf8_async(stdin, this._cancellable, (p, res) => {
                try {
                    const [, stdout, stderr] = p.communicate_utf8_finish(res);
                    resolve({
                        ok: p.get_successful(),
                        code: p.get_exit_status(),
                        stdout: this._truncate(stdout ?? ''),
                        stderr: this._truncate(stderr ?? ''),
                    });
                } catch (e) {
                    resolve({ok: false, code: -1, stdout: '', stderr: String(e)});
                }
            });
        });
    }

    runJson(args) {
        return this.run([...args, '--json']).then((r) => {
            if (!r.ok && !r.stdout) {
                return {ok: false, data: null, error: r.stderr || `code ${r.code}`};
            }
            const data = this._extractJson(r.stdout);
            if (data === null) {
                return {ok: false, data: null, error: 'sortie JSON invalide'};
            }
            return {ok: true, data, error: ''};
        });
    }

    _extractJson(text) {
        if (!text) {
            return null;
        }
        const trimmed = text.trim();
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            const start = trimmed.indexOf('{');
            const end = trimmed.lastIndexOf('}');
            if (start === -1 || end <= start) {
                return null;
            }
            try {
                return JSON.parse(trimmed.slice(start, end + 1));
            } catch (e2) {
                return null;
            }
        }
    }

    cancel() {
        if (this._cancellable) {
            this._cancellable.cancel();
        }
    }
}
