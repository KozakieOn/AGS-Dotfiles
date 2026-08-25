import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { createPoll } from "ags/time"

// Widgets
import  BatteryWidget from "./Battery"
import  ClockWidget from "./Date and Time/Clock"
import SystemTrayButton from "./SystemTray/SystemTrayButton"

export default function Bar(gdkmonitor: Gdk.Monitor) {
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
        <box $type="start"/>
        <box $type="center" halign={Gtk.Align.CENTER}>
            <ClockWidget />
        </box>
        
        <box $type="end" halign={Gtk.Align.CENTER} spacing={10} margin_end={30}>
          <SystemTrayButton />
          <BatteryWidget />
        </box>
      </centerbox>
    </window>
  )
}
