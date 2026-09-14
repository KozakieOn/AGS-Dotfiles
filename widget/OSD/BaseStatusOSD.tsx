import { Gtk, Astal } from "ags/gtk4"
import GLib from "gi://GLib"
import { state } from "../../global"

export interface BaseStatusOSDProps {
    name: string
    assetsPath: string
    getStateImage: () => string 
    connectService: (onUpdate: () => void) => void
}

export default function BaseStatusOSD({ name, assetsPath, getStateImage, connectService }: BaseStatusOSDProps) {
    let hideTimeoutId: number | null = null
    let windowHideTimeoutId: number | null = null

    const picture = new Gtk.Picture({
        valign: Gtk.Align.CENTER,
        halign: Gtk.Align.CENTER,
        can_shrink: true,
    })
    picture.add_css_class("osd-status-image")

    const box = new Gtk.Box({
        valign: Gtk.Align.CENTER,
        halign: Gtk.Align.CENTER,
    })
    box.add_css_class("osd-container")
    box.append(picture)

    const revealer = new Gtk.Revealer({
        transition_type: Gtk.RevealerTransitionType.SLIDE_DOWN,
        transition_duration: 300,
        child: box,
        reveal_child: false,
    })

    const win = new Astal.Window({
        name,
        anchor: Astal.WindowAnchor.TOP,
        margin_top: 10,
        layer: Astal.Layer.OVERLAY,
        visible: false,
        child: revealer,
    })

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

    const updateUI = () => {
        const fileName = getStateImage()
        // On construit le chemin absolu de l'image
        // Note: Selon ton setup, tu devras peut-être ajouter le chemin racine de la config (ex: SRC + assetsPath)
        const fullPath = `${assetsPath}/${fileName}` 
        picture.set_filename(fullPath)
    }

    // Écoute des changements de signal du service connecté
    connectService(() => {
        updateUI()
        showOSD()
    })

    updateUI()
    return win
}