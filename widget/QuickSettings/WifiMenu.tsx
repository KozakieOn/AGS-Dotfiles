import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
//@ts-ignore
import Network from "gi://AstalNetwork"

interface AccessPoint {
    ssid: string | null
    iconName: string
    strength?: number
    flags?: number
    wpaFlags?: number
    rsnFlags?: number
}

function getKnownNetworks(): string[] {
    try {
        const [success, stdout] = GLib.spawn_command_line_sync("nmcli -t -f NAME connection show")
        if(success && stdout){
            const output = new TextDecoder().decode(stdout)
            return output.split("\n").map(n => n.trim()).filter(n => n !== "")
        }
    } catch (e) {
        console.error("[WifiMenu] Erreur lecture réseau :", e)
    }
    return []
}

function getActiveSsid(): string | null {
    try {
        const [success, stdout] = GLib.spawn_command_line_sync("LC_ALL=C nmcli -t -f TYPE,NAME,ACTIVE connection show --active")
        if (success && stdout) {
            const output = new TextDecoder().decode(stdout)
            for (const line of output.split("\n")) {
                if (line.startsWith("802-11-wireless:") && line.endsWith(":yes")) {
                    const parts = line.split(":")
                    if (parts.length >= 3) {
                        parts.pop()
                        parts.shift()
                        return parts.join(":").trim() || null
                    }
                }
            }
        }
    } catch (e) {
        console.error("[WifiMenu] Erreur lecture SSID actif :", e)
    }
    return null
}

export default function WifiMenu() {
    const assetsPath = `${GLib.get_user_config_dir()}/ags/assets/Tray/Network`

    const getCustomWifiIcon = (wifi: any) => {
        const state = wifi.state ?? 0
        const strength = wifi.strength ?? 0

        if (state <= 30) return `${assetsPath}/no-wifi.svg`
        if (strength <= 25) return `${assetsPath}/wifi-low.svg`
        if (strength <= 50) return `${assetsPath}/wifi-mid1.svg`
        if (strength <= 75) return `${assetsPath}/wifi-mid2.svg`
        return `${assetsPath}/wifi-high.svg`
    }

    const network = Network.get_default()
    if (!network || !network.wifi) return <box />
    
    const wifi = network.wifi

    const toggleWifi = () => {
        const isEnabled = wifi.state > 30
        GLib.spawn_command_line_async(`nmcli radio wifi ${isEnabled ? "off" : "on"}`)
    }

    // --- Bouton principal (Toggle Wi-Fi) ---
    const mainButton = new Gtk.Button({
        hexpand: true,
        cssClasses: ["qs-toggle-main"],
    })

    const iconImage = new Gtk.Image({ pixelSize: 24 })
    const titleLabel = new Gtk.Label({ label: "Wi-Fi", halign: Gtk.Align.START, cssClasses: ["qs-title"] })
    const subtitleLabel = new Gtk.Label({ halign: Gtk.Align.START, cssClasses: ["qs-subtitle"] })

    const textBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        valign: Gtk.Align.CENTER,
    })
    textBox.append(titleLabel)
    textBox.append(subtitleLabel)

    const mainContentBox = new Gtk.Box({
        spacing: 12,
        valign: Gtk.Align.CENTER,
        halign: Gtk.Align.START,
        marginStart: 8,
    })
    mainContentBox.append(iconImage)
    mainContentBox.append(textBox)
    mainButton.set_child(mainContentBox)

    mainButton.connect("clicked", toggleWifi)

    // Mise à jour de l'UI du bouton principal via les signaux
    const updateMainButton = () => {
        const state = wifi.state ?? 0
        const ssid = wifi.ssid

        // Application de ton icône SVG perso
        iconImage.set_from_file(getCustomWifiIcon(wifi))
        subtitleLabel.set_label(ssid || "Déconnecté")

        if (state > 30) {
            mainButton.add_css_class("active")
        } else {
            mainButton.remove_css_class("active")
        }
    }

    wifi.connect("notify::state", updateMainButton)
    wifi.connect("notify::ssid", updateMainButton)
    wifi.connect("notify::icon-name", updateMainButton)
    updateMainButton()

    // --- Bouton Flèche (Sous-menu) ---
    let isOpen = false
    const arrowImage = new Gtk.Image({ iconName: "pan-down-symbolic", pixelSize: 16 })
    const arrowButton = new Gtk.Button({
        cssClasses: ["qs-toggle-arrow"],
        child: arrowImage,
    })

    const revealer = new Gtk.Revealer({
        transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
        transitionDuration: 250,
        revealChild: false,
    })

    arrowButton.connect("clicked", () => {
        isOpen = !isOpen
        revealer.set_reveal_child(isOpen)
        arrowImage.set_from_icon_name(isOpen ? "pan-up-symbolic" : "pan-down-symbolic")
    })

    // --- Liste des réseaux Wi-Fi ---
    const apListBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 2,
    })

    const scrolledWindow = new Gtk.ScrolledWindow({
        heightRequest: 200,
        cssClasses: ["qs-wifi-scroll"],
    })
    scrolledWindow.set_child(apListBox)

    const listContainer = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 4,
        cssClasses: ["qs-wifi-list-container"],
    })
    listContainer.append(scrolledWindow)
    revealer.set_child(listContainer)

    const updateAccessPoints = () => {
        let child = apListBox.get_first_child()
        while (child !== null) {
            const next = child.get_next_sibling()
            apListBox.remove(child)
            child = next
        }

        const knownNetworks = getKnownNetworks()
        const activeSsid = getActiveSsid()
        const aps = wifi.accessPoints ?? []
        const uniqueAps = aps.filter((ap: AccessPoint, index: number, self: AccessPoint[]) =>
            ap.ssid && index === self.findIndex((t: AccessPoint) => t.ssid === ap.ssid)
        )

        const knownBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4})
        const unknownBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4})

        knownBox.append(new Gtk.Label({ label: "Réseaux enregistré", halign: Gtk.Align.START, cssClasses:["qs-subtitle"]}))
        unknownBox.append(new Gtk.Label({ label: "Autres réseaux", halign: Gtk.Align.START, cssClasses:["qs-subtitle"]}))
        
        let hasKnown = false
        let hasUnknown = false

        for (const ap of uniqueAps) {
            const isKnown = knownNetworks.includes(ap.ssid!)
            if(isKnown) {
                knownBox.append(createApRow(ap, activeSsid, true, updateAccessPoints))
                hasKnown = true
            } else {
                unknownBox.append(createApRow(ap, activeSsid, false, updateAccessPoints))
                hasUnknown = true
            }
        }

        if (hasKnown) apListBox.append(knownBox)
        if (hasUnknown) apListBox.append(unknownBox)
    }

    wifi.connect("notify::access-points", updateAccessPoints)
    wifi.connect("notify::ssid", updateAccessPoints)
    updateAccessPoints()

    // --- Assemblage final du composant ---
    const splitButtonBox = new Gtk.Box({
        cssClasses: ["qs-split-button"],
        halign: Gtk.Align.FILL,
    })
    splitButtonBox.append(mainButton)
    splitButtonBox.append(arrowButton)

    const wrapper = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 8,
    })
    wrapper.append(splitButtonBox)
    wrapper.append(revealer)

    return wrapper
}

function createApRow(ap: AccessPoint, currentSsid: string | null, isKnown: boolean, onRefresh: () => void) {
    const isConnected = currentSsid === ap.ssid
    const assetsPath = `${GLib.get_user_config_dir()}/ags/assets/Tray/Network`

    const strength = ap.strength ?? 50
    let iconName = "wifi-high.svg"
    if (strength <= 25) iconName = "wifi-low.svg"
    else if (strength <= 50) iconName = "wifi-mid1.svg"
    else if (strength <= 75) iconName = "wifi-mid2.svg"

    const isEncrypted = (ap.flags ?? 0) > 0 || (ap.wpaFlags ?? 0) > 0 || (ap.rsnFlags ?? 0) > 0

    const rowBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        cssClasses: ["qs-ap-item"],
        marginStart: 4, marginEnd: 4,
    })
    
    const topBox = new Gtk.Box({spacing: 8})
    const icon = new Gtk.Image({ file: `${assetsPath}/${iconName}`, pixelSize: 18 })
    const label = new Gtk.Label({
        label: ap.ssid || "Inconnu",
        hexpand: true,
        halign: Gtk.Align.START,
        cssClasses: isConnected ? ["qs-ap-label", "active"] : ["qs-ap-label"],
    })

    topBox.append(icon)
    topBox.append(label)

    const toggleBtn = new Gtk.Button({ child: topBox, cssClasses: ["qs-ap-toggle"] })

    const actionsBox = new Gtk.Box({ spacing: 8, marginTop: 8, marginBottom: 4 })
    const revealer = new Gtk.Revealer({
        transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
        child: actionsBox,
        revealChild: isConnected,
    })

    toggleBtn.connect("clicked", () => revealer.set_reveal_child(!revealer.get_reveal_child()))

    if (isConnected) {
        const disconnectBtn = new Gtk.Button({ label: "Déconnecter", cssClasses: ["qs-ap-btn"] })
        disconnectBtn.connect("clicked", () => {
            GLib.spawn_command_line_async(`nmcli connection down "${ap.ssid}"`)
            revealer.set_reveal_child(false)
            setTimeout(onRefresh, 100)
            setTimeout(onRefresh, 400)
        })
        
        const forgetBtn = new Gtk.Button({ label: "Oublier", cssClasses: ["qs-ap-btn", "danger"] })
        forgetBtn.connect("clicked", () => {
            GLib.spawn_command_line_async(`nmcli connection down "${ap.ssid}"`)
            GLib.spawn_command_line_async(`nmcli connection delete "${ap.ssid}"`)
            revealer.set_reveal_child(false)
            setTimeout(onRefresh, 100)
            setTimeout(onRefresh, 400)
        })
        
        actionsBox.append(disconnectBtn)
        actionsBox.append(forgetBtn)
    }
    else if (isKnown){
        const connectBtn = new Gtk.Button({ label: "Connecter", cssClasses: ["qs-ap-btn"] })
        connectBtn.connect("clicked", () => {
            GLib.spawn_command_line_async(`nmcli connection up "${ap.ssid}"`)
            setTimeout(onRefresh, 400)
        })
        
        const forgetBtn = new Gtk.Button({ label: "Oublier", cssClasses: ["qs-ap-btn", "danger"] })
        forgetBtn.connect("clicked", () => {
            GLib.spawn_command_line_async(`nmcli connection delete "${ap.ssid}"`)
            setTimeout(onRefresh, 400)
        })
        
        actionsBox.append(connectBtn)
        actionsBox.append(forgetBtn)
    }
    else {
        if (!isEncrypted) {
            const connectBtn = new Gtk.Button({ label: "Connecter", cssClasses: ["qs-ap-btn", "active"] })
            connectBtn.connect("clicked", () => {
                GLib.spawn_command_line_async(`nmcli device wifi connect "${ap.ssid}"`)
                setTimeout(onRefresh, 800)
            })
            actionsBox.append(connectBtn)
        } else {
            const pwEntry = new Gtk.Entry({ placeholder_text: "Mot de passe...", visibility: false, hexpand: true })
            const connectBtn = new Gtk.Button({ label: "Valider", cssClasses: ["qs-ap-btn", "active"] })
            
            connectBtn.connect("clicked", () => {
                const pw = pwEntry.get_text()
                if (pw) GLib.spawn_command_line_async(`nmcli device wifi connect "${ap.ssid}" password "${pw}"`)
                else GLib.spawn_command_line_async(`nmcli device wifi connect "${ap.ssid}"`)
                setTimeout(onRefresh, 1000)
            })
            
            actionsBox.append(pwEntry)
            actionsBox.append(connectBtn)
        }
    }

    rowBox.append(toggleBtn)
    rowBox.append(revealer)

    return rowBox
}