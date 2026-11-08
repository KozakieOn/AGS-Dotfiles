import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
//@ts-ignore
import Network from "gi://AstalNetwork"
import { QsMenuItem } from "./QsMenuItem"

interface AccessPoint {
    ssid: string | null
    iconName: string
    strength?: number
    flags?: number
    wpaFlags?: number
    rsnFlags?: number
}

// Vrai tant que le champ mot de passe a le focus : on ne reconstruit pas la liste
// pendant la saisie, sinon l'Entry est détruit et recréé (texte et focus perdus).
let passwordFieldFocused = false

// Lance une commande avec un tableau d'arguments (pas de shell, donc pas de
// problème avec les guillemets, $, espaces... dans un SSID ou un mot de passe).
function run(argv: string[]) {
    try {
        GLib.spawn_async(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null)
    } catch (e) {
        console.error("[WifiMenu] Erreur spawn :", e)
    }
}

function getKnownNetworks(): string[] {
    try {
        const [success, stdout] = GLib.spawn_command_line_sync("nmcli -t -f NAME connection show")
        if (success && stdout) {
            return new TextDecoder().decode(stdout).split("\n").map(n => n.trim()).filter(n => n !== "")
        }
    } catch (e) {
        console.error("[WifiMenu] Erreur lecture réseau :", e)
    }
    return []
}

function getActiveSsid(): string | null {
    try {
        const [success, stdout] = GLib.spawn_command_line_sync("nmcli -t -f TYPE,NAME,ACTIVE connection show --active")
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
        run(["nmcli", "radio", "wifi", isEnabled ? "off" : "on"])
    }

    const iconImage = new Gtk.Image({ pixelSize: 24 })
    const apListBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 2,
    })

    // Création via notre composant partagé
    const menu = new QsMenuItem({
        title: "Wi-Fi",
        iconWidget: iconImage,
        listContent: apListBox,
        onMainClick: toggleWifi,
        subtitleMaxWidthChars: 16,
    })

    const updateMainButton = () => {
        const state = wifi.state ?? 0
        const ssid = wifi.ssid
        const isEnabled = state > 30

        iconImage.set_from_file(getCustomWifiIcon(wifi))
        menu.setActive(isEnabled)

        if (!isEnabled) {menu.setSubtitle("Désactivé")}
        else {menu.setSubtitle(ssid || "Déconnecté")}
    }

    wifi.connect("notify::state", updateMainButton)
    wifi.connect("notify::ssid", updateMainButton)
    wifi.connect("notify::icon-name", updateMainButton)
    updateMainButton()

    const updateAccessPoints = () => {
        // Ne pas casser la saisie du mot de passe en cours
        if (passwordFieldFocused) return

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

        const knownBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4 })
        const unknownBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4 })

        knownBox.append(new Gtk.Label({ label: "Réseaux enregistrés", halign: Gtk.Align.START, cssClasses: ["qs-subtitle"] }))
        unknownBox.append(new Gtk.Label({ label: "Autres réseaux", halign: Gtk.Align.START, cssClasses: ["qs-subtitle"] }))

        let hasKnown = false
        let hasUnknown = false

        for (const ap of uniqueAps) {
            const isKnown = knownNetworks.includes(ap.ssid!)
            if (isKnown) {
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

    return menu.wrapper
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

    const topBox = new Gtk.Box({ spacing: 8 })
    const icon = new Gtk.Image({ file: `${assetsPath}/${iconName}`, pixelSize: 18 })
    const label = new Gtk.Label({
        label: ap.ssid || "Inconnu",
        hexpand: true,
        halign: Gtk.Align.START,
        ellipsize:3,
        wrapMode: Gtk.WrapMode.WORD_CHAR,
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
            run(["nmcli", "connection", "down", ap.ssid!])
            revealer.set_reveal_child(false)
            setTimeout(onRefresh, 400)
        })

        const forgetBtn = new Gtk.Button({ label: "Oublier", cssClasses: ["qs-ap-btn", "danger"] })
        forgetBtn.connect("clicked", () => {
            run(["nmcli", "connection", "down", ap.ssid!])
            run(["nmcli", "connection", "delete", ap.ssid!])
            revealer.set_reveal_child(false)
            setTimeout(onRefresh, 400)
        })

        actionsBox.append(disconnectBtn)
        actionsBox.append(forgetBtn)
    } else if (isKnown) {
        const connectBtn = new Gtk.Button({ label: "Connecter", cssClasses: ["qs-ap-btn"] })
        connectBtn.connect("clicked", () => {
            run(["nmcli", "connection", "up", ap.ssid!])
            setTimeout(onRefresh, 400)
        })

        const forgetBtn = new Gtk.Button({ label: "Oublier", cssClasses: ["qs-ap-btn", "danger"] })
        forgetBtn.connect("clicked", () => {
            run(["nmcli", "connection", "delete", ap.ssid!])
            setTimeout(onRefresh, 400)
        })

        actionsBox.append(connectBtn)
        actionsBox.append(forgetBtn)
    } else {
        if (!isEncrypted) {
            const connectBtn = new Gtk.Button({ label: "Connecter", cssClasses: ["qs-ap-btn", "active"] })
            connectBtn.connect("clicked", () => {
                run(["nmcli", "device", "wifi", "connect", ap.ssid!])
                setTimeout(onRefresh, 800)
            })
            actionsBox.append(connectBtn)
        } else {
            const pwEntry = new Gtk.Entry({ placeholderText: "Mot de passe...", visibility: false, hexpand: true })

            // Suivi du focus : tant que le champ est actif, la liste n'est plus reconstruite
            const focusCtrl = new Gtk.EventControllerFocus()
            focusCtrl.connect("notify::contains-focus", () => {
                passwordFieldFocused = focusCtrl.containsFocus
            })
            pwEntry.add_controller(focusCtrl)
            // Sécurité : si le champ disparaît (menu fermé, revealer replié), on libère le blocage
            pwEntry.connect("unmap", () => { passwordFieldFocused = false })

            // focusOnClick: false -> cliquer sur "Valider" ne retire pas le focus du champ
            // (et évite qu'un rafraîchissement ne détruise le bouton pendant le clic)
            const connectBtn = new Gtk.Button({
                label: "Valider",
                cssClasses: ["qs-ap-btn", "active"],
                focusOnClick: false,
            })

            const submit = () => {
                const pw = pwEntry.get_text()
                passwordFieldFocused = false
                if (pw) run(["nmcli", "device", "wifi", "connect", ap.ssid!, "password", pw])
                else run(["nmcli", "device", "wifi", "connect", ap.ssid!])
                setTimeout(onRefresh, 1000)
            }

            connectBtn.connect("clicked", submit)
            pwEntry.connect("activate", submit) // validation avec la touche Entrée

            actionsBox.append(pwEntry)
            actionsBox.append(connectBtn)
        }
    }

    rowBox.append(toggleBtn)
    rowBox.append(revealer)

    return rowBox
}