import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"

export default function ClockWidget() {
  const time = createPoll("", 1000, "date '+%H:%M'")

  return (
      <label label={time} class="clock_label" valign={Gtk.Align.CENTER} />
  )
}