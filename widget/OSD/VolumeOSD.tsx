//@ts-ignore
import Wp from "gi://AstalWp"
import BaseOSD from "./BaseOSD"
import VolumeWidget from "../SystemTray/Volume"

export default function VolumeOSD() {
    const audio = Wp.get_default()?.audio
    const icon = VolumeWidget({ size: 24 })

    return BaseOSD({
        name: "volume-osd",
        icon,
        getValue: () => audio?.default_speaker?.volume ?? 0,
        setValue: (val) => audio?.default_speaker?.set_volume(val),
        connectService: (onUpdate) => {
            if (!audio) return
            const connect = () => {
                const speaker = audio.default_speaker
                if (speaker) {
                    speaker.connect("notify::volume", onUpdate)
                    speaker.connect("notify::mute", onUpdate)
                }
            }
            audio.connect("notify::default-speaker", connect)
            connect()
        },
    })
}