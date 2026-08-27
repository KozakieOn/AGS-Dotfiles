//@ts-ignore
import Brightness from "./brightnessService"
import BaseOSD from "./BaseOSD"
import BrightnessWidget from "../SystemTray/Brightness"
export default function BrightnessOSD() {
    const brightness = Brightness.get_default()
    const icon = BrightnessWidget({ size: 24 })

    return BaseOSD({
        name: "brightness-osd",
        icon,
        getValue: () => brightness?.screen ?? 0,
        setValue: (val) => {
            if (brightness) brightness.screen = val
        },
        connectService: (onUpdate) => {
            brightness?.connect("notify::screen", onUpdate)
        },
    })
}