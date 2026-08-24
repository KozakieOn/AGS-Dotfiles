import { Gtk, Gdk } from "ags/gtk4"
import GLib from "gi://GLib"
import Gio from "gi://Gio"
//@ts-ignore
import AstalBattery from "gi://AstalBattery"

// Constantes de configuration
const CONFIG = {
    widgetSize: 45,

    // Jauge
    barMaxWidth: 35,
    barHeight: 17,
    barMarginLeft: 4,

    // Eclair
    thunderSize: 12,
}

export default function Battery() {
    const bat = AstalBattery.get_default()
    const configDir = GLib.get_user_config_dir()
    const assetsPath = `${configDir}/ags/assets/Battery`

    // Jauge de la batterie
    const fillBar = new Gtk.Box({
        halign: Gtk.Align.START,
        valign: Gtk.Align.FILL,
    })

    // Conteneur de fond
    const bgContainer = new Gtk.Box({
        halign: Gtk.Align.START,
        valign: Gtk.Align.CENTER,
        margin_start: CONFIG.barMarginLeft,
        width_request: CONFIG.barMaxWidth,
        height_request: CONFIG.barHeight,
    })
    bgContainer.append(fillBar)
    bgContainer.add_css_class("battery-bg")

    // Cadre de la batterie
    const framePicture = new Gtk.Picture({
        file: Gio.File.new_for_path(`${assetsPath}/batteryFrame.svg`),
        can_shrink: true,
        content_fit: Gtk.ContentFit.CONTAIN,
        width_request: CONFIG.widgetSize,
        height_request: CONFIG.widgetSize,
    })

    // Label du pourcentage
    const label = new Gtk.Label({
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
    })

    // Éclair
    const thunderPicture = new Gtk.Image({
        file: `${assetsPath}/thunder.svg`,
        pixel_size: CONFIG.thunderSize,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
    })

    const thunderContainer = new Gtk.Box({
        halign: Gtk.Align.END,
        valign: Gtk.Align.END,
        margin_end: 0, 
        margin_bottom: 5,
    })
    thunderContainer.add_css_class("thunder-bg")
    thunderContainer.append(thunderPicture)

    // Mis à jour UI
    const updateUI = () => {
        const rawP = bat.percentage
        const p = rawP > 1 ? rawP / 100 : rawP
        const isCharging = bat.charging

        // Ajustement dynamique
        const fillWidth = Math.max(0, Math.min(CONFIG.barMaxWidth, Math.round(CONFIG.barMaxWidth * p)))
        fillBar.set_size_request(fillWidth, CONFIG.barHeight)

        fillBar.set_css_classes(["battery-fill"])

        // Couleur de la jauge
        if (isCharging || p >= 1.0) { fillBar.add_css_class("charging") } 
        else if (p <= 0.15) { fillBar.add_css_class("low") } 
        else if (p <= 0.30) { fillBar.add_css_class("warning") } 
        else { fillBar.add_css_class("normal") }

        // Couleur du texte
        if (p < 0.45 && !isCharging) { label.set_css_classes(["battery-percentage", "text-light"]) } 
        else { label.set_css_classes(["battery-percentage", "text-dark"]) }

        label.set_label(`${Math.round(p * 100)}`)
        thunderContainer.set_visible(isCharging)
    }

    bat.connect("notify::percentage", updateUI)
    bat.connect("notify::charging", updateUI)
    updateUI()

    const overlay = new Gtk.Overlay({
        width_request: CONFIG.widgetSize,
        height_request: CONFIG.widgetSize,
        child: bgContainer,
    })

    // Ajout des couches supérieures
    overlay.add_overlay(framePicture)
    overlay.add_overlay(thunderContainer)
    overlay.add_overlay(label)

    return overlay
}