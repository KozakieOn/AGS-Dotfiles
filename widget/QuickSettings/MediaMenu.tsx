import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import Gio from "gi://Gio"
//@ts-ignore
import Mpris from "gi://AstalMpris"

export default function MediaMenu() {
    const mpris = Mpris.get_default()
    if (!mpris) return <box />

    // Conteneur principal du widget de style "QuickSettings"
    const wrapper = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 8,
        cssClasses: ["qs-container", "qs-media-box"],
        widthRequest: 250,
    })

    // Éléments de l'interface
    const coverImage = new Gtk.Image({
        pixelSize: 64,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        cssClasses: ["qs-media-cover"],
    })

    const titleLabel = new Gtk.Label({
        label: "Aucun média",
        halign: Gtk.Align.START,
        ellipsize: 3,
        max_width_chars:20,
        cssClasses: ["qs-title"],
    })

    const artistLabel = new Gtk.Label({
        label: "En attente...",
        halign: Gtk.Align.START,
        ellipsize: 3,
        cssClasses: ["qs-subtitle"],
    })

    const textBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        valign: Gtk.Align.CENTER,
        hexpand: true,
    })
    textBox.append(titleLabel)
    textBox.append(artistLabel)

    // Ligne supérieure : Cover + Infos (Titre / Artiste)
    const topRow = new Gtk.Box({
        spacing: 12,
        valign: Gtk.Align.CENTER,
        marginStart: 8,
        marginEnd: 8,
        marginTop: 8,
    })
    topRow.append(coverImage)
    topRow.append(textBox)

    // Boutons de contrôle (Backward, Play/Pause, Next)
    const prevBtn = new Gtk.Button({
        child: new Gtk.Image({ iconName: "media-skip-backward-symbolic", pixelSize: 16 }),
        cssClasses: ["qs-ap-btn"],
        hexpand: true,
    })

    const playPauseBtn = new Gtk.Button({
        child: new Gtk.Image({ iconName: "media-playback-start-symbolic", pixelSize: 16 }),
        cssClasses: ["qs-ap-btn", "active"],
        hexpand: true,
    })

    const nextBtn = new Gtk.Button({
        child: new Gtk.Image({ iconName: "media-skip-forward-symbolic", pixelSize: 16 }),
        cssClasses: ["qs-ap-btn"],
        hexpand: true,
    })

    // Connexion des clics une seule fois en amont
    prevBtn.connect("clicked", () => {
        const player = mpris.get_players()[0]
        if (player) player.previous()
    })

    nextBtn.connect("clicked", () => {
        const player = mpris.get_players()[0]
        if (player) player.next()
    })

    playPauseBtn.connect("clicked", () => {
        const player = mpris.get_players()[0]
        if (player) player.play_pause()
    })

    const controlsRow = new Gtk.Box({
        spacing: 6,
        marginStart: 8,
        marginEnd: 8,
        marginBottom: 8,
    })
    controlsRow.append(prevBtn)
    controlsRow.append(playPauseBtn)
    controlsRow.append(nextBtn)

    wrapper.append(topRow)
    wrapper.append(controlsRow)

    const updateUI = () => {
        const players = mpris.get_players()
        const player = players[0]

        if (!player) {
            titleLabel.set_label("Aucun média")
            artistLabel.set_label("Inconnu")
            coverImage.clear()
            playPauseBtn.set_sensitive(false)
            prevBtn.set_sensitive(false)
            nextBtn.set_sensitive(false)
            return
        }

        playPauseBtn.set_sensitive(true)
        prevBtn.set_sensitive(true)
        nextBtn.set_sensitive(true)

        titleLabel.set_label(player.title || "Piste inconnue")
        artistLabel.set_label(player.artist || "Artiste inconnu")

        const isPlaying = player.playback_status === Mpris.PlaybackStatus.PLAYING
        const playIcon = playPauseBtn.get_child() as Gtk.Image
        if (playIcon) {
            playIcon.set_from_icon_name(isPlaying ? "media-playback-pause-symbolic" : "media-playback-start-symbolic")
        }

        if (player.art_url) {
            let imageUrl = player.art_url

            if (imageUrl.startsWith("file://")) {
                const filePath = imageUrl.replace("file://", "")
                try {
                    coverImage.set_from_file(filePath)
                } catch (e) {
                    coverImage.set_from_icon_name("audio-x-generic-symbolic")
                }
            } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
                const tmpPath = `${GLib.get_user_cache_dir()}/ags/media_cover`
                GLib.mkdir_with_parents(tmpPath, 0o755)
                const destFile = `${tmpPath}/current_cover.jpg`

                GLib.spawn_command_line_async(`curl -sL "${imageUrl}" -o "${destFile}"`)
                
                setTimeout(() => {
                    try {
                        const file = Gio.File.new_for_path(destFile)
                        // AJOUT DE `null` ICI :
                        if (file.query_exists(null)) {
                            coverImage.set_from_file(destFile)
                        } else {
                            coverImage.set_from_icon_name("audio-x-generic-symbolic")
                        }
                    } catch (e) {
                        coverImage.set_from_icon_name("audio-x-generic-symbolic")
                    }
                }, 300)
            } else {
                coverImage.set_from_icon_name("audio-x-generic-symbolic")
            }
        } else {
            coverImage.set_from_icon_name("audio-x-generic-symbolic")
        }
    }

    mpris.connect("notify::players", updateUI)
    
    const connectPlayerSignals = () => {
        const player = mpris.get_players()[0]
        if (player) {
            player.connect("notify::title", updateUI)
            player.connect("notify::artist", updateUI)
            player.connect("notify::playback-status", updateUI)
            player.connect("notify::art-url", updateUI)
        }
    }

    mpris.connect("notify::players", connectPlayerSignals)
    connectPlayerSignals()
    updateUI()

    return wrapper
}