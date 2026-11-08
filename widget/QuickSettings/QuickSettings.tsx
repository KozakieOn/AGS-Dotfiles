import App from "ags/gtk4/app"
import { Astal, Gtk } from "ags/gtk4"

import WifiMenu from "./WifiMenu"
import BluetoothMenu from "./BluetoothMenu"
import AudioMenu from "./AudioMenu"
import MediaMenu from "./MediaMenu"

// À utiliser depuis le bouton de la barre (l'ancien toggle direct marche aussi)
export function toggleQuickSettings() {
    const win = App.get_window("quick-settings")
    if (win) win.visible = !win.visible
}

export default function Quicksettings() {
    // Fenêtre transparente plein écran placée derrière le menu :
    // un clic n'importe où ailleurs la touche, ce qui ferme le menu.
    const backdrop = new Astal.Window({
        name: "quick-settings-backdrop",
        cssClasses: ["qs-backdrop"],
        application: App,
        anchor:
            Astal.WindowAnchor.TOP |
            Astal.WindowAnchor.BOTTOM |
            Astal.WindowAnchor.LEFT |
            Astal.WindowAnchor.RIGHT,
        exclusivity: Astal.Exclusivity.IGNORE,
        layer: Astal.Layer.TOP,        // sous le menu (OVERLAY)
        keymode: Astal.Keymode.NONE,   // ne vole jamais le focus clavier
        visible: false,
    })
    backdrop.set_child(new Gtk.Box({ hexpand: true, vexpand: true }))

    const click = new Gtk.GestureClick()
    click.connect("pressed", () => {
        console.log("[QuickSettings] clic sur le fond -> fermeture")
        const win = App.get_window("quick-settings")
        if (win) win.visible = false
    })
    backdrop.add_controller(click)

    const win = (
        <window
            name="quick-settings"
            cssClasses={["quick-settings"]}
            anchor={Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.RIGHT}
            marginBottom={10}
            marginRight={10}
            layer={Astal.Layer.OVERLAY}
            keymode={Astal.Keymode.ON_DEMAND}
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
                    <MediaMenu />
                </box>

                <box spacing={16} orientation={Gtk.Orientation.HORIZONTAL}>
                    <AudioMenu />
                </box>

                <box spacing={16} orientation={Gtk.Orientation.HORIZONTAL}>
                    <WifiMenu />
                    <BluetoothMenu />
                </box>
            </box>
        </window>
    ) as unknown as Astal.Window
}