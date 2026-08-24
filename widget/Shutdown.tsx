import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"

export default function ShutdownButton() {
  return (
    <menubutton cssName="shutdown-btn">
      <label label="⏻" />

      <popover>
        <box orientation={Gtk.Orientation.VERTICAL} spacing={10}>
          <button 
            onClicked={() => execAsync(["systemctl","poweroff"]).catch(console.error)}
          >
            <label label="Éteindre" />
          </button>
          <button
            onClicked={() => execAsync(["systemctl", "reboot"]).catch(console.error)}
            >
                <label label="Redémarrer" />
          </button>
          <button
            onClicked={() => execAsync(["hyprlock"]).catch(console.error)}
            >
                <label label="Vérouiller" />
          </button>
        </box>
      </popover>
      
    </menubutton>
  )
}