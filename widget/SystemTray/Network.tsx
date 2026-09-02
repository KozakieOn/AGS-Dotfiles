import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
//@ts-ignore
import Network from "gi://AstalNetwork"

export default function NetworkWidget() {
    const network = Network.get_default()
    const assetsPath = `${GLib.get_user_config_dir()}/ags/assets/Tray/Network`

    const icon = new Gtk.Image({
        pixel_size: 30,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
    })

    const updateUI = () => {
        if (!network) return

        let iconName = "no-network.svg"

        try {
            const wifi = network.wifi
            
            if (wifi) {
                const state = wifi.state ?? 0
                const strength = wifi.strength ?? (typeof wifi.get_strength === "function" ? wifi.get_strength() : 0)

                if (state <= 30) {iconName = "no-wifi.svg"}
                else if (strength <= 25) {iconName = "wifi-low.svg"}
                else if (strength <= 50) {iconName = "wifi-mid1.svg"}
                else if (strength <= 75) {iconName = "wifi-mid2.svg"} else {iconName = "wifi-high.svg"}
            } else if (network.wired) {
                iconName = "ethernet.svg"
            } else {
                iconName = "no-network.svg"
            } 
        } catch (error) {
            print(`[Network Error] Erreur lors de la lecture du Wi-Fi : ${error}`)
        }

        icon.set_from_file(`${assetsPath}/${iconName}`)
    }

    if (network) {
        network.connect("notify::primary", updateUI)
        network.connect("notify::wifi", updateUI)
        
        if (network.wifi) {
            network.wifi.connect("notify::strength", updateUI)
            network.wifi.connect("notify::state", updateUI)
            network.wifi.connect("notify::enabled", updateUI)
        }
        
        updateUI()
    }

    return icon
}