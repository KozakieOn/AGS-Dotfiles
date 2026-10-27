import { Gtk } from "ags/gtk4"
import App from "ags/gtk4/app"

import NetworkWidget from "./Network"
import VolumeWidget from "./Volume"
import Battery from "../Battery"

export default function SystemTrayButton() {
    return (
        <button 
            class="system_tray_btn"
            valign={Gtk.Align.CENTER}
            onClicked={() => {
                const win = App.get_window("quick-settings")
                if (win) {
                    win.visible = !win.visible 
                }
            }}
        >
            <box class="system_tray_container" spacing={10} valign={Gtk.Align.CENTER}>
                <VolumeWidget />
                <NetworkWidget />
                <Battery />
            </box>
        </button>
    )
}