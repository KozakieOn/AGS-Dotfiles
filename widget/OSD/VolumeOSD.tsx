import { Gtk, Astal } from "ags/gtk4"
import GLib from "gi://GLib"
//@ts-ignore
import Wp from "gi://AstalWp"

// Si le fichier globals.ts est dans le dossier src/, remplace par "../../globals" 
// Si globals.ts est à la racine absolue du projet, utilise "../globals"
import { state } from "../../global"

export default function VolumeOSD() {
    const audio = Wp.get_default()?.audio
    const assetsPath = `${GLib.get_user_config_dir()}/ags/assets/Tray`
    let timeoutId: number | null = null

    // 1. Icône de l'OSD
    const icon = new Gtk.Image({
        pixel_size: 24,
    })

    // 2. Barre de niveau (LevelBar)
    const levelBar = new Gtk.LevelBar({
        valign: Gtk.Align.CENTER,
        width_request: 200,
        min_value: 0,
        max_value: 1.0,
    })
    levelBar.add_css_class("osd-bar")

    // 3. Conteneur principal
    const box = new Gtk.Box({
        spacing: 12,
        valign: Gtk.Align.CENTER,
    })
    box.add_css_class("osd-container")
    box.append(icon)
    box.append(levelBar)

    // 4. Fenêtre OSD
    const win = new Astal.Window({
        name: "volume-osd",
        anchor: Astal.WindowAnchor.BOTTOM,
        margin_bottom: 80,
        layer: Astal.Layer.OVERLAY,
        visible: false,
        child: box,
    })

    // Fonction de mise à jour visuelle
    const updateUI = () => {
        if (!audio || !audio.default_speaker) return

        const speaker = audio.default_speaker
        const vol = speaker.volume
        const isMute = speaker.mute

        // Mise à jour de la barre
        levelBar.value = vol

        // Mise à jour de l'icône
        let iconName = "volume-high.png"
        if (isMute || vol <= 0) iconName = "volume-mute.png"
        else if (vol <= 0.33) iconName = "volume-low.png"
        else if (vol <= 0.66) iconName = "volume-medium.png"

        icon.set_from_file(`${assetsPath}/${iconName}`)
    }

    // Gestion des événements audio et du chrono de disparition
    if (audio) {
        const connectSpeaker = () => {
            const speaker = audio.default_speaker
            if (speaker) {
                speaker.connect("notify::volume", () => {
                    updateUI()

                    // Si le pop-up est actif, on n'affiche pas l'OSD
                    if (state.inhibitOSD) return

                    // Affichage de l'OSD
                    win.visible = true

                    // Reset du timer de 2 secondes
                    if (timeoutId) GLib.source_remove(timeoutId)
                    timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
                        win.visible = false
                        timeoutId = null
                        return GLib.SOURCE_REMOVE
                    })
                })
                speaker.connect("notify::mute", updateUI)
            }
            updateUI()
        }

        audio.connect("notify::default-speaker", connectSpeaker)
        connectSpeaker()
    }

    return win
}