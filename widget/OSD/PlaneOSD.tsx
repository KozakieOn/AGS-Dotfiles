import { Gtk, Astal } from "ags/gtk4"
import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import { state } from "../../global"

const assetsPath = "/home/aloys/.config/ags/assets/OSD/Plane"
const ICONS = {
    on: `${assetsPath}/plane.svg`,
    off: `${assetsPath}/plane_off.svg`,
}

export default function PlaneOSD() {
    let hideTimeoutId: number | null = null
    let windowHideTimeoutId: number | null = null
    let isAirplaneOn = false

    const checkAirplaneState = (): boolean => {
        try {
            const [success, stdout] = GLib.spawn_command_line_sync("nmcli radio wifi")
            if (success && stdout) {
                const output = new TextDecoder().decode(stdout).trim()
                return output === "disabled"
            }
        } catch (e) {
            console.error("Erreur lors de la vérification de l'état wifi:", e)
        }
        return false
    }

    isAirplaneOn = checkAirplaneState()

    // --- ÉTAPE 2 : TEST DU WIDGET ---
    // On utilise d'abord une icône système de test ("network-wireless-symbolic").
    // Si cette icône s'affiche, le problème vient exclusivement de ton fichier SVG ou de son décodage.
    const icon = new Gtk.Image({
        // file: targetIconPath, // <- Décommente ceci une fois le test validé
        icon_name: "network-wireless-symbolic",
        pixel_size: 32,
    })
    icon.set_size_request(32, 32)

    const box = new Gtk.Box({
        valign: Gtk.Align.CENTER,
        halign: Gtk.Align.CENTER,
    })
    box.add_css_class("osd-container")
    box.append(icon)

    const revealer = new Gtk.Revealer({
        transition_type: Gtk.RevealerTransitionType.SLIDE_DOWN,
        transition_duration: 300,
        child: box,
        reveal_child: false,
    })

    const win = new Astal.Window({
        name: "plane-osd",
        anchor: Astal.WindowAnchor.TOP,
        margin_top: 15,
        layer: Astal.Layer.OVERLAY,
        visible: false,
        child: revealer,
    })
    win.add_css_class("plane-osd")

    const showOSD = () => {
        if (state.inhibitOSD) return
        win.visible = true
        revealer.reveal_child = true

        if (hideTimeoutId) GLib.source_remove(hideTimeoutId)
        if (windowHideTimeoutId) GLib.source_remove(windowHideTimeoutId)

        hideTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
            revealer.reveal_child = false
            hideTimeoutId = null

            windowHideTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, revealer.transition_duration, () => {
                win.visible = false
                windowHideTimeoutId = null
                return GLib.SOURCE_REMOVE
            })
            return GLib.SOURCE_REMOVE
        })
    }

    const toggleAirplaneMode = () => {
        try {
            isAirplaneOn = !isAirplaneOn
            const newIconPath = isAirplaneOn ? ICONS.on : ICONS.off
            
            console.log("Basculement -> Mode avion :", isAirplaneOn, "| Nouvelle icône :", newIconPath)
            
            // Remplace par ton fichier une fois testé
            // icon.file = newIconPath
            icon.file = newIconPath

            showOSD()

            const action = isAirplaneOn ? "off" : "on"
            GLib.spawn_command_line_async(`nmcli radio wifi ${action}`)

        } catch (e) {
            console.error("Erreur lors du basculement du mode avion:", e)
        }
    }

    app.connect("request", (_, args: string[], res) => {
        if (args[0] === "toggle-plane-osd") {
            toggleAirplaneMode()
            if (typeof res === "function") res("ok")
        }
    })

    return win
}