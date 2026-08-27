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

    // Mise à jour UI
    const updateUI = () => {
        if (!network) return

        let iconName = "no-network.svg"

        try {
            const isPortal = network.connectivity === 3 || 
                             (network.internet !== undefined && network.internet === Network.Internet?.PORTAL)

            if (isPortal) {
                iconName = "wifi-cog.svg"
            } else if (network.wifi) {
                const wifi = network.wifi
                const strength = wifi.strength ?? (typeof wifi.get_strength === "function" ? wifi.get_strength() : 0)

                if (strength <= 0) { iconName = "no-wifi.svg" }
                else if (strength <= 25) { iconName = "wifi-low.svg" }
                else if (strength <= 50) { iconName = "wifi-mid1.svg" }
                else if (strength <= 75) { iconName = "wifi-mid2.svg" }
                else { iconName = "wifi-high.svg" }
            } else if (network.wired) {
                iconName = "ethernet.svg"
            } else {
                iconName = "no-network.svg"
            } 
        } catch (error) {
            print(`[Network Error] Erreur lors de la lecture du Wi-Fi : ${error}`)
        }

        // Application de l'image
        icon.set_from_file(`${assetsPath}/${iconName}`)
    }

    // Connexion aux signaux système
    if (network) {
        network.connect("notify::primary", updateUI)
        network.connect("notify::wifi", updateUI)
        network.connect("notify::connectivity", updateUI)
        
        if (network.wifi) {
            network.wifi.connect("notify::strength", updateUI)
            network.wifi.connect("notify::state", updateUI)
        }
        
        updateUI()
    }

    return icon
}