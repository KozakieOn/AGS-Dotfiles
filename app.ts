import app from "ags/gtk4/app"
import style from "./style/style.scss"
import Bar from "./widget/Bar"
import VolumeOSD from "./widget/OSD/VolumeOSD"
import BrightnessOSD from "./widget/OSD/BrightnessOSD"
import Quicksettings from "./widget/QuickSettings/QuickSettings"
import { cyclePowerProfile } from "./widget/OSD/Powerprofil"

app.start({
  css: style,
  main() {
    app.get_monitors().map(Bar)
    VolumeOSD()
    BrightnessOSD()
    Quicksettings()
  },
  requestHandler(request, res) {
        if (request[0] === "cycle-power-osd") {
            cyclePowerProfile(true) // Passer au profil suivant + OSD
            res("ok") // N'oublie pas de répondre "ok" pour que la commande se termine
        }
    }
})
