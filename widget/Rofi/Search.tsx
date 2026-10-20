import { Gtk } from "ags/gtk4"
import App from "ags/gtk4/app"
import GLib from "gi://GLib"

const assetsPath = `${GLib.get_user_config_dir()}/ags/assets/Search`

export default function SearchRofi(){
    return (
        <button
            class="rofiBtn"
            valign={Gtk.Align.CENTER}
            onClicked={() => {
                GLib.spawn_command_line_async("wofi --show drun")
            }}
        >
            <image 
                file={`${assetsPath}/Fedora.png`} 
                pixel_size={32} 
            />
        </button>
    )
}