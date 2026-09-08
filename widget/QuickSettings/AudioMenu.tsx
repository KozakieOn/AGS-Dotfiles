import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
//@ts-ignore
import Wp from "gi://AstalWp"
import { QsMenuItem } from "./QsMenuItem"

export default function AudioMenu() {
    const wp = Wp.get_default()
    const audio = wp?.audio

    if (!audio) return <box />

    // Chemin vers vos icônes SVG
    const assetsPath = `${GLib.get_user_config_dir()}/ags/assets/Tray/Volume`

    // Sélection dynamique de l'icône SVG selon l'état et le niveau de volume
    const getCustomAudioIcon = (isMuted: boolean, vol: number) => {
        if (isMuted) return `${assetsPath}/speaker-mute.svg`
        if (vol === 0) return `${assetsPath}/speaker-off.svg`
        if (vol < 33) return `${assetsPath}/speaker-low.svg`
        if (vol < 75) return `${assetsPath}/speaker-medium.svg`
        return `${assetsPath}/speaker-high.svg`
    }

    const toggleMute = () => {
        const speaker = audio.defaultSpeaker
        if (speaker) {
            const currentMute = typeof speaker.get_mute === "function" ? speaker.get_mute() : speaker.mute
            if (typeof speaker.set_mute === "function") {
                speaker.set_mute(!currentMute)
            } else {
                speaker.mute = !currentMute
            }
            updateUI()
        }
    }

    const iconImage = new Gtk.Image({ pixelSize: 32 })
    const deviceListBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 2,
    })

    const menu = new QsMenuItem({
        title: "Audio",
        iconWidget: iconImage,
        listContent: deviceListBox,
        onMainClick: toggleMute,
        onToggleOpen: (isOpen) => {
            if (isOpen) updateDevicesList()
        },
    })

    const updateDevicesList = () => {
        let child = deviceListBox.get_first_child()
        while (child !== null) {
            const next = child.get_next_sibling()
            deviceListBox.remove(child)
            child = next
        }

        const speakers = audio.get_speakers()
        const subtitleBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4, marginBottom: 4 })
        
        subtitleBox.append(new Gtk.Label({ 
            label: "Périphériques de sortie", 
            halign: Gtk.Align.START, 
            cssClasses: ["qs-subtitle"] 
        }))
        deviceListBox.append(subtitleBox)

        for (const speaker of speakers) {
            const isConnected = audio.defaultSpeaker === speaker

            const rowBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                cssClasses: ["qs-ap-item"],
                marginStart: 4, marginEnd: 4,
            })

            const topBox = new Gtk.Box({ spacing: 8 })
            const icon = new Gtk.Image({ iconName: "audio-speakers-symbolic", pixelSize: 18 })
            const label = new Gtk.Label({
                label: speaker.description || "Périphérique Audio",
                hexpand: true,
                halign: Gtk.Align.START,
                ellipsize: 3,
                lines: 2,
                cssClasses: isConnected ? ["qs-ap-label", "active"] : ["qs-ap-label"],
            })

            topBox.append(icon)
            topBox.append(label)

            const selectBtn = new Gtk.Button({ child: topBox, cssClasses: ["qs-ap-toggle"] })

            selectBtn.connect("clicked", () => {
                if (typeof speaker.set_is_default === "function") {
                    speaker.set_is_default(true)
                } else {
                    speaker.is_default = true
                }
                setTimeout(() => {
                    attachSpeakerListeners()
                    updateUI()
                    updateDevicesList()
                }, 200)
            })

            rowBox.append(selectBtn)
            deviceListBox.append(rowBox)
        }
    }

    const updateUI = () => {
        const speaker = audio.defaultSpeaker
        if (!speaker) {
            menu.setActive(false)
            menu.setSubtitle("Aucun")
            iconImage.set_from_file(`${assetsPath}/speaker-mute.svg`)
            return
        }

        const isMuted = typeof speaker.get_mute === "function" ? speaker.get_mute() : Boolean(speaker.mute)
        const rawVol = typeof speaker.get_volume === "function" ? speaker.get_volume() : speaker.volume
        const vol = Math.round((rawVol ?? 0) * 100)

        // Application de l'icône SVG personnalisée via set_from_file
        iconImage.set_from_file(getCustomAudioIcon(isMuted, vol))

        menu.setActive(!isMuted)

        if (isMuted) {
            menu.setSubtitle("Désactivé")
        } else {
            menu.setSubtitle(speaker.description || `${vol}%`)
        }
    }

    let activeSpeaker: any = null
    const attachSpeakerListeners = () => {
        const speaker = audio.defaultSpeaker
        if (speaker && speaker !== activeSpeaker) {
            activeSpeaker = speaker
            speaker.connect("notify::mute", updateUI)
            speaker.connect("notify::volume", updateUI)
            speaker.connect("notify::description", updateUI)
        }
    }

    audio.connect("notify::default-speaker", () => {
        attachSpeakerListeners()
        updateUI()
        updateDevicesList()
    })

    attachSpeakerListeners()
    updateUI()

    return menu.wrapper
}