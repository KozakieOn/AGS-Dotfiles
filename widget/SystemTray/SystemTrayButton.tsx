import { Gtk } from "ags/gtk4"

import NetworkWidget from "./Network"
import VolumeWidget from "./Volume"
import Battery from "../Battery"
import { toggleQuickSettings } from "../QuickSettings/QuickSettings"

export default function SystemTrayButton() {
    return (
        <button
            class="system_tray_btn"
            valign={Gtk.Align.CENTER}
            onClicked={toggleQuickSettings}
        >
            <box class="system_tray_container" spacing={10} valign={Gtk.Align.CENTER}>
                <VolumeWidget />
                <NetworkWidget />
                <Battery />
            </box>
        </button>
    )
}