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

        // Gestion du Réseau
        try {
            const wifi = network.wifi
            
            if (wifi) {
                const strength = wifi.strength ?? (typeof wifi.get_strength === "function" ? wifi.get_strength() : 0)

                if (strength <= 0) {iconName = "no-wifi.png"}
                else if (strength <= 25) {iconName = "wifi1.png"}
                else if (strength <= 50) {iconName = "wifi2.png"}
                else if (strength <= 75) {iconName = "wifi3.png"}
                else {iconName = "wifi4.png"}
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
        
        if (network.wifi) {
            network.wifi.connect("notify::strength", updateUI)
        }
        
        updateUI()
    }

    return icon
}