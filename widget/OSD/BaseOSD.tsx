import { Gtk, Astal } from "ags/gtk4"
import GLib from "gi://GLib"
import { state } from "../../global"

export interface BaseOSDProps {
    name: string
    icon: Gtk.Widget
    getValue: () => number
    setValue: (value: number) => void
    connectService: (onUpdate: () => void) => void
}

export default function BaseOSD({ name, icon, getValue, setValue, connectService }: BaseOSDProps) {
    let hideTimeoutId: number | null = null
    let windowHideTimeoutId: number | null = null
    let isUpdating = false

    // Curseur interactif
    const scale = new Gtk.Scale({
        orientation: Gtk.Orientation.HORIZONTAL,
        valign: Gtk.Align.CENTER,
        width_request: 200,
        draw_value: false,
    })
    
    scale.set_range(0.0, 1.0)
    scale.set_increments(0.05, 0.1)
    scale.add_css_class("osd-scale")

    scale.connect("value-changed", () => {
        if (isUpdating) return
        setValue(scale.get_value())
        showOSD()
    })

    // Conteneur principal
    const box = new Gtk.Box({
        spacing: 12,
        valign: Gtk.Align.CENTER,
    })
    box.add_css_class("osd-container")
    box.append(icon)
    box.append(scale)

    // Revealer & Window
    const revealer = new Gtk.Revealer({
        transition_type: Gtk.RevealerTransitionType.SLIDE_UP,
        transition_duration: 300,
        child: box,
        reveal_child: false,
    })

    const win = new Astal.Window({
        name,
        anchor: Astal.WindowAnchor.BOTTOM,
        margin_bottom: 10,
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
        isUpdating = true
        scale.set_value(getValue())
        isUpdating = false
    }

    // Écoute des changements de signal du service connecté
    connectService(() => {
        updateUI()
        showOSD()
    })

    updateUI()
    return win
}