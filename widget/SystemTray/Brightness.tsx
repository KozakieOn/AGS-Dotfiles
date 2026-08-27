import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
//@ts-ignore
import Brightness from "../OSD/brightnessService"

export interface BrightnessWidgetProps {
    size?: number
}

export default function BrightnessWidget({ size = 30 }: BrightnessWidgetProps = {}) { 
    const brightness = Brightness.get_default()
    const assetsPath = `${GLib.get_user_config_dir()}/ags/assets/Tray/Brightness`

    const icon = new Gtk.Image({
        pixel_size: size,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
    })

    const updateUI = () => {
        if (!brightness) return

        const screen = brightness.screen ?? 0

        let iconName = "brightness-high.svg"

        if (screen <= 0.1) {
            iconName = "brightness-off.svg"
        } else if (screen <= 0.33) {
            iconName = "brightness-low.svg"
        } else if (screen <= 0.75) {
            iconName = "brightness-medium.svg"
        }

        icon.set_from_file(`${assetsPath}/${iconName}`)
    }

    if (brightness) {
        brightness.connect("notify::screen", updateUI)
        updateUI()
    }
    
    return icon
}