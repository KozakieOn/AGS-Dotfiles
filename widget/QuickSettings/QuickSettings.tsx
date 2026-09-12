import App from "ags/gtk4/app"
import { Astal, Gtk } from "ags/gtk4"

import WifiMenu from "./WifiMenu"
import BluetoothMenu from "./BluetoothMenu"
import AudioMenu from "./AudioMenu"
import { PowerMenuButton } from "../OSD/Powerprofil"

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
            <box 
                orientation={Gtk.Orientation.VERTICAL}
                spacing={16} 
                cssClasses={["qs-container"]} 
                valign={Gtk.Align.END} 
                halign={Gtk.Align.END}
            >
                <box spacing={16} orientation={Gtk.Orientation.HORIZONTAL}>
                    <AudioMenu />
                    <PowerMenuButton />
                </box>

                <box spacing={16} orientation={Gtk.Orientation.HORIZONTAL}>
                    <WifiMenu />
                    <BluetoothMenu />
                </box>
            </box>
        </window>
    )
}