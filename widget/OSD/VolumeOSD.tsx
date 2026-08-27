import { Gtk, Astal } from "ags/gtk4"
import GLib from "gi://GLib"
//@ts-ignore
import Wp from "gi://AstalWp"
import { state } from "../../global"
import VolumeWidget from "../SystemTray/Volume"
export default function VolumeOSD() {
    const audio = Wp.get_default()?.audio
    
    let hideTimeoutId: number | null = null
    let windowHideTimeoutId: number | null = null
    let isUpdating = false 

    const icon = VolumeWidget({ size: 24 })

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
        if (isUpdating || !audio?.default_speaker) return
        
        const newVol = scale.get_value()
        audio.default_speaker.set_volume(newVol)
        showOSD()
    })

    // 3. Conteneur principal
    const box = new Gtk.Box({
        spacing: 12,
        valign: Gtk.Align.CENTER,
    })
    box.add_css_class("osd-container")
    box.append(icon) // On ajoute ton composant importé ici
    box.append(scale)

    // ... (Le reste du code de l'OSD reste exactement le même pour le Revealer, la Window et showOSD)
    
    const revealer = new Gtk.Revealer({
        transition_type: Gtk.RevealerTransitionType.SLIDE_UP,
        transition_duration: 300,
        child: box,
        reveal_child: false,
    })

    const win = new Astal.Window({
        name: "volume-osd",
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

    // Fonction de mise à jour visuelle JUSTE pour le curseur (l'icône se gère toute seule maintenant)
    const updateUI = () => {
        if (!audio || !audio.default_speaker) return
        const speaker = audio.default_speaker
        const vol = speaker.volume ?? 0

        isUpdating = true
        scale.set_value(vol)
        isUpdating = false
    }

    if (audio) {
        const connectSpeaker = () => {
            const speaker = audio.default_speaker
            if (speaker) {
                // On met à jour le curseur et on affiche l'OSD
                speaker.connect("notify::volume", () => {
                    updateUI()
                    showOSD()
                })
                speaker.connect("notify::mute", () => {
                    updateUI()
                    showOSD()
                })
            }
            updateUI()
        }

        audio.connect("notify::default-speaker", connectSpeaker)
        connectSpeaker()
    }

    return win
}