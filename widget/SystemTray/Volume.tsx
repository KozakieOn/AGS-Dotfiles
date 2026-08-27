import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
//@ts-ignore
import Wp from "gi://AstalWp"

export default function VolumeWidget() { 
    const audio = Wp.get_default()?.audio
    const assetsPath = `${GLib.get_user_config_dir()}/ags/assets/Tray/Volume`

    const icon = new Gtk.Image({
        pixel_size: 30,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
    })

    const updateUI = () => {
        if (!audio || !audio.default_speaker) return

        const speaker = audio.default_speaker
        const vol = speaker.volume
        const isMute = speaker.mute

        let iconName = "speaker-high.svg"

        if (isMute) {iconName = "speaker-mute.svg"}
        else if (vol <= 0) {iconName = "speaker-off.svg"}
        else if (vol <= 0.33) {iconName = "speaker-low.svg"}
        else if (vol <= 0.75) {iconName = "speaker-medium.svg"}

        icon.set_from_file(`${assetsPath}/${iconName}`)
    }

    if (audio) {
        const connectSpeaker = () => {
            const speaker = audio.default_speaker
            if(speaker) {
                speaker.connect("notify::volume", updateUI)
                speaker.connect("notify::mute", updateUI)
            }
            updateUI()
        }

        audio.connect("notify::default-speaker", connectSpeaker)
        connectSpeaker()
    }
    
    return icon
}