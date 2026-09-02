import { Gtk } from "ags/gtk4"
import App from "ags/gtk4/app"

import NetworkWidget from "./Network"
import VolumeWidget from "./Volume"

export default function SystemTrayButton() {
    return (
        <button 
            class="system-tray-btn"
            valign={Gtk.Align.CENTER}
            onClicked={() => {
                const win = App.get_window("quick-settings")
                if (win) {
                    win.visible = !win.visible 
                }
            }}
        >
            <box spacing={10} valign={Gtk.Align.CENTER}>
                <VolumeWidget />
                <NetworkWidget />
            </box>
        </button>
    )
}