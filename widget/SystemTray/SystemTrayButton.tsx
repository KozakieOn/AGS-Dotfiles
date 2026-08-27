import { Gtk } from "ags/gtk4"

import NetworkWidget from "./Network"
import VolumeWidget from "./Volume"

export default function SystemTrayButton() {
    return (
        <button 
            class="system-tray-btn"
            valign={Gtk.Align.CENTER}
            onClicked={() => 
                print("Ouvrir le menu rapide !")
            }
        >
            <box spacing={10} valign={Gtk.Align.CENTER}>
                <VolumeWidget />
                <NetworkWidget />
            </box>
        </button>
    )
}