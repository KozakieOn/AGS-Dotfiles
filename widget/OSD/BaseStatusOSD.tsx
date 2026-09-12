import { Gtk, Astal } from "ags/gtk4"
import GLib from "gi://GLib"
import { state } from "../../global"

export interface BaseStatusOSDProps {
    name: string
    iconWidget: Gtk.Widget
    labelWidget: Gtk.Label
}

export interface StatusOSDController {
    win: Astal.Window
    showOSD: (text?: string) => void
}

export default function BaseStatusOSD({ name, iconWidget, labelWidget }: BaseStatusOSDProps): StatusOSDController {
    let hideTimeoutId: number | null = null
    let windowHideTimeoutId: number | null = null

    const box = new Gtk.Box({
        spacing: 12,
        valign: Gtk.Align.CENTER,
        halign: Gtk.Align.CENTER,
    })
    box.add_css_class("osd-container")
    box.append(iconWidget)
    box.append(labelWidget)

    const revealer = new Gtk.Revealer({
        transition_type: Gtk.RevealerTransitionType.SLIDE_UP,
        transition_duration: 300,
        child: box,
        reveal_child: false,
    })

    const win = new Astal.Window({
        name,
        anchor: Astal.WindowAnchor.BOTTOM,
        margin_bottom: 50,
        layer: Astal.Layer.OVERLAY,
        visible: false,
        child: revealer,
    })

    const showOSD = (text?: string) => {
        if (state.inhibitOSD) return
        if (text) labelWidget.set_label(text)

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

    return { win, showOSD }
}