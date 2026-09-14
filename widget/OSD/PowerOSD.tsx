import { Gtk, Astal } from "ags/gtk4"
import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import { state } from "../../global"

const assetsPath = `${GLib.get_user_config_dir()}/ags/assets/OSD/Powerprofil`
const CUSTOM_ICONS: Record<string, string> = {
    "power-saver": `${assetsPath}/eco.svg`,
    "balanced": `${assetsPath}/balanced.svg`,
    "performance": `${assetsPath}/perf.svg`,
}
const PROFILES = ["power-saver", "balanced", "performance"]

export default function PowerOSD() {
    let hideTimeoutId: number | null = null
    let windowHideTimeoutId: number | null = null
    let currentProfile = "balanced"

    // Initialisation : récupérer le profil actuel
    try {
        const [, stdout] = GLib.spawn_command_line_sync("powerprofilesctl get")
        if (stdout) {
            currentProfile = new TextDecoder().decode(stdout).trim()
        }
    } catch (e) {
        console.error("Erreur lors de la récupération du profil:", e)
    }

    const icon = new Gtk.Image({
        file: CUSTOM_ICONS[currentProfile] || CUSTOM_ICONS["balanced"],
        pixel_size: 32,
    })

    const box = new Gtk.Box({
        valign: Gtk.Align.CENTER,
        halign: Gtk.Align.CENTER,
    })
    box.add_css_class("osd-container")
    box.append(icon)

    // Revealer & Window configurés pour venir du haut
    const revealer = new Gtk.Revealer({
        transition_type: Gtk.RevealerTransitionType.SLIDE_DOWN, // Glisse vers le bas
        transition_duration: 300,
        child: box,
        reveal_child: false,
    })

    const win = new Astal.Window({
        name: "power-osd",
        anchor: Astal.WindowAnchor.TOP,
        margin_top: 15,
        layer: Astal.Layer.OVERLAY,
        visible: false,
        child: revealer,
    })
    win.add_css_class("power-osd")

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

    const setProfile = (profile: string) => {
        try {
            GLib.spawn_command_line_sync(`powerprofilesctl set ${profile}`)
            currentProfile = profile
            
            // Mise à jour visuelle avec le fichier image correspondant
            icon.file = CUSTOM_ICONS[profile] || CUSTOM_ICONS["balanced"]
            
            showOSD()
        } catch (e) {
            console.error("Erreur lors du changement de profil:", e)
        }
    }

    const cycleProfile = () => {
        const currentIndex = PROFILES.indexOf(currentProfile)
        const nextIndex = (currentIndex + 1) % PROFILES.length
        setProfile(PROFILES[nextIndex])
    }

    // Écoute de la requête envoyée par le bind Hyprland
    app.connect("request", (_, args: string[], res) => {
        if (args[0] === "cycle-power-osd") {
            cycleProfile()
            // Répond à Hyprland que la commande s'est bien exécutée
            if (typeof res === "function") res("ok") 
        }
    })

    return win
}