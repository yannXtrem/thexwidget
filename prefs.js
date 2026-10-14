import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class XWidgetPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('X Widget'),
            icon_name: 'utilities-terminal-symbolic',
        });
        window.add(page);

        const behavior = new Adw.PreferencesGroup({title: _('Comportement')});
        page.add(behavior);

        const xPath = new Adw.EntryRow({
            title: _('Chemin du binaire x'),
            text: settings.get_string('x-path'),
        });
        xPath.connect('apply', () => {
            settings.set_string('x-path', xPath.text.trim());
        });
        behavior.add(xPath);

        const refresh = new Adw.SpinRow({
            title: _('Intervalle de rafraîchissement (s)'),
            adjustment: new Gtk.Adjustment({
                lower: 10,
                upper: 3600,
                step_increment: 5,
                value: settings.get_int('refresh-seconds'),
            }),
        });
        refresh.connect('notify::value', () => {
            settings.set_int('refresh-seconds', refresh.value);
        });
        behavior.add(refresh);

        const maxLines = new Adw.SpinRow({
            title: _('Lignes de sortie conservées'),
            adjustment: new Gtk.Adjustment({
                lower: 20,
                upper: 2000,
                step_increment: 20,
                value: settings.get_int('max-output-lines'),
            }),
        });
        maxLines.connect('notify::value', () => {
            settings.set_int('max-output-lines', maxLines.value);
        });
        behavior.add(maxLines);

        const display = new Adw.PreferencesGroup({title: _('Affichage')});
        page.add(display);

        const desktopWidget = new Adw.SwitchRow({
            title: _('Widget de bureau'),
            subtitle: _('Informations + barre de commande sur le bureau'),
            active: settings.get_boolean('show-desktop-widget'),
        });
        desktopWidget.connect('notify::active', () => {
            settings.set_boolean('show-desktop-widget', desktopWidget.active);
        });
        display.add(desktopWidget);

        const corner = new Adw.ComboRow({
            title: _('Coin du widget'),
            model: Gtk.StringList.new(['top-right', 'top-left', 'bottom-right', 'bottom-left']),
        });
        const cornerValue = settings.get_string('desktop-corner');
        const corners = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
        corner.set_selected(Math.max(0, corners.indexOf(cornerValue)));
        corner.connect('notify::selected', () => {
            settings.set_string('desktop-corner', corners[corner.selected]);
        });
        display.add(corner);

        const opacity = new Adw.SpinRow({
            title: _('Opacité du widget'),
            adjustment: new Gtk.Adjustment({
                lower: 0.2,
                upper: 1.0,
                step_increment: 0.05,
                value: settings.get_double('desktop-opacity'),
            }),
        });
        opacity.connect('notify::value', () => {
            settings.set_double('desktop-opacity', opacity.value);
        });
        display.add(opacity);

        const about = new Adw.PreferencesGroup({title: _('À propos')});
        page.add(about);
        about.add(new Adw.ActionRow({
            title: _('The X Widget Assistant'),
            subtitle: _('Extension GNOME Shell pour l\'outil x'),
        }));
    }
}