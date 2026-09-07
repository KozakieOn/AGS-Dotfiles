import App from "ags/gtk4/app"
import { Astal, Gtk } from "ags/gtk4"

import WifiMenu from "./WifiMenu"
import BluetoothMenu from "./BluetoothMenu"

export default function Quicksettings(){
    return (
        <window
            name="quick-settings"
            anchor={Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.RIGHT}
            margin_bottom={10}
            marginRight={10}
            layer={Astal.Layer.OVERLAY}
            visible={false}
            application={App}
        >
            {/* On ajoute hexpand et halign sur la boîte pour qu'elle se colle à droite et ne prenne que la place nécessaire */}
            <box 
                spacing={16} 
                cssClasses={["qs-container"]} 
                valign={Gtk.Align.START} 
                halign={Gtk.Align.END}
            >
                <WifiMenu />
                <BluetoothMenu />
            </box>
        </window>
    )
}