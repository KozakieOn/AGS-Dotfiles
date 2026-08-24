import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { createPoll } from "ags/time"

/* Widgets */
import  ShutdownButton from "./Shutdown"
import  BatteryWidget from "./Battery"

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const time = createPoll("", 1000, "date")
  const { BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      name="bar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={BOTTOM | LEFT | RIGHT}
      application={app}
    >
      <centerbox cssName="centerbox">
        <box $type="center" />
        <menubutton $type="end" hexpand halign={Gtk.Align.CENTER}>
          <label label={time} />
          <popover>
            <Gtk.Calendar />
          </popover>
        </menubutton>
        <box $type="end" halign={Gtk.Align.CENTER} spacing={10}>
          <menubutton hexpand>
            <label label={time} />
            <popover>
              <Gtk.Calendar />
            </popover>
          </menubutton>
          <BatteryWidget />
          <ShutdownButton />
        </box>
      </centerbox>
    </window>
  )
}
