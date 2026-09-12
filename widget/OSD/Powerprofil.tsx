import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import BaseStatusOSD from "./BaseStatusOSD"
import { QsButton, QsStateConfig } from "../QuickSettings/QsButton"

export type PowerProfile = "power-saver" | "balanced" | "performance"

const POWER_STATES: QsStateConfig<PowerProfile>[] = [
    { value: "power-saver", label: "Économie", subtitle: "Mode Économie", iconName: "battery-level-20-symbolic" },
    { value: "balanced", label: "Équilibré", subtitle: "Mode Équilibré", iconName: "battery-level-60-symbolic" },
    { value: "performance", label: "Performance", subtitle: "Mode Performance", iconName: "battery-level-100-charge-symbolic" },
]

let currentProfile: PowerProfile = "balanced"

// OSD Singleton
const osdLabel = new Gtk.Label({ cssClasses: ["osd-text"] })
const osdIcon = new Gtk.Image({ iconName: "power-profile-balanced-symbolic", pixelSize: 24 })
const powerOSD = BaseStatusOSD({
    name: "power-osd",
    iconWidget: osdIcon,
    labelWidget: osdLabel,
})

export function setPowerProfile(profile: PowerProfile, showOSD: boolean = false) {
    currentProfile = profile
    GLib.spawn_command_line_async(`powerprofilesctl set ${profile}`)

    const stateConfig = POWER_STATES.find(s => s.value === profile)!
    osdIcon.set_from_icon_name(stateConfig.iconName!)

    if (showOSD) {
        powerOSD.showOSD(`Profil : ${stateConfig.label}`)
    }
}

export function cyclePowerProfile(showOSD: boolean = false) {
    const currentIndex = POWER_STATES.findIndex(s => s.value === currentProfile)
    const nextIndex = (currentIndex + 1) % POWER_STATES.length
    setPowerProfile(POWER_STATES[nextIndex].value, showOSD)
}

export function PowerMenuButton() {
    return new QsButton<PowerProfile>({
        title: "Énergie",
        states: POWER_STATES,
        getValue: () => currentProfile,
        onSelect: (newVal, triggerOSD) => setPowerProfile(newVal, triggerOSD),
    }).wrapper
}