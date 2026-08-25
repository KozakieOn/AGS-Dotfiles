import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"

export default function ClockWidget() {
  const time = createPoll("", 1000, "date '+%H:%M'")

  return (
    <menubutton class="clock-widget" halign={Gtk.Align.CENTER}>
      <label label={time} class="clock-label" />
      <popover>
        <Gtk.Calendar class="clock-calendar" />
      </popover>
    </menubutton>
  )
}