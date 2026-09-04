import App from "ags/gtk4/app"
import { Astal } from "ags/gtk4"

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
            <box spacing={16} cssClasses={["qs-container"]}>
                <WifiMenu />
                <BluetoothMenu />
            </box>
        </window>
    )
}