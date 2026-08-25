import app from "ags/gtk4/app"
import style from "./style/style.scss"
import Bar from "./widget/Bar"
import VolumeOSD from "./widget/OSD/VolumeOSD"

app.start({
  css: style,
  main() {
    app.get_monitors().map(Bar)
    VolumeOSD()
  },
})
