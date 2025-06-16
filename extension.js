import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Meta from 'gi://Meta';

let collapsed_holder = []

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {

        _init(extension) {
            super._init(0.0, _('Colpander'));

            const iconPath_wizard_down = extension.path + '/icons/wizard_down.png';

            const iconFile_wizard_down = Gio.File.new_for_path(iconPath_wizard_down);
            const customIcon_wizard_down = Gio.FileIcon.new(iconFile_wizard_down);

            this.add_child(new St.Icon({
                gicon: customIcon_wizard_down,
                icon_size: 24,
            }));
            this.connect('button-press-event', this._onButtonPressed.bind(this));
        }

        _onButtonPressed(actor, event) {
            const workspaceManager = global.workspace_manager;
            const activeWorkspace = workspaceManager.get_active_workspace();

            const windows = activeWorkspace.list_windows();
            const normalWindows = windows.filter(window =>
                !window.skip_taskbar &&
                !window.is_override_redirect() &&
                window.get_window_type() === Meta.WindowType.NORMAL
            );

            if (normalWindows.length > 0) {
                let isAnyOpened = false;

                normalWindows.forEach(window => {
                    if (typeof window.minimized === 'boolean') {
                        if (window.minimized === false) {
                            isAnyOpened = true;
                        }
                    }
                });

                if (isAnyOpened) {
                    normalWindows.forEach(window => {
                        if (typeof window.minimized === 'boolean') {
                            collapsed_holder.push(window.get_id());
                            window.minimize();
                        }
                    });
                } else {
                    if (collapsed_holder && collapsed_holder.length > 0) {
                        const currentWindowsMap = new Map();
                        global.get_window_actors().forEach(actor => {
                            const metaWindow = actor.meta_window;
                            if (metaWindow && !metaWindow.skip_taskbar && !metaWindow.skip_pager) {
                                currentWindowsMap.set(metaWindow.get_id(), metaWindow);
                            }
                        });

                        for (let i = 0; i < collapsed_holder.length; i++) {
                            const windowIdToUnminimize = collapsed_holder[i];
                            const window = currentWindowsMap.get(windowIdToUnminimize);

                            if (window instanceof Meta.Window) {
                                if (typeof window.minimized === 'boolean' && window.minimized) {
                                    window.unminimize();
                                }
                            }
                        }

                        collapsed_holder = [];
                    }
                }

            }
            return true;
        }
    });

export default class IndicatorExampleExtension extends Extension {
    enable() {
        this._indicator = new Indicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}