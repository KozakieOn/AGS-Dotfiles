import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import { QsMenuItem } from "./QsMenuItem"

interface BluetoothDevice {
    mac: string
    name: string
    connected: boolean
    paired: boolean
}

function execCmd(command: string): string {
    try {
        const [success, stdout] = GLib.spawn_command_line_sync(command)
        if (success && stdout) {
            return new TextDecoder().decode(stdout)
        }
    } catch (e) {
        console.error("[BluetoothMenu] Erreur commande :", command, e)
    }
    return ""
}

function isBluetoothPowered(): boolean {
    const stdout = execCmd("bluetoothctl show")
    return stdout.includes("Powered: yes")
}

function getDevices(): BluetoothDevice[] {
    const devices: BluetoothDevice[] = []
    const rawDevices = execCmd("bluetoothctl devices").split("\n")

    for (const line of rawDevices) {
        const parts = line.trim().split(" ")
        if (parts.length >= 3 && parts[0] === "Device") {
            const mac = parts[1]
            const name = parts.slice(2).join(" ")

            const info = execCmd(`bluetoothctl info ${mac}`)
            const connected = info.includes("Connected: yes")
            const paired = info.includes("Paired: yes")

            devices.push({ mac, name, connected, paired })
        }
    }
    return devices
}

export default function BluetoothMenu() {
    const togglePower = () => {
        const powered = isBluetoothPowered()
        GLib.spawn_command_line_async(`bluetoothctl power ${powered ? "off" : "on"}`)
        setTimeout(updateUI, 500)
    }

    const iconImage = new Gtk.Image({ iconName: "bluetooth-active-symbolic", pixelSize: 24 })
    const deviceListBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 2,
    })

    // Création via notre composant partagé
    const menu = new QsMenuItem({
        title: "Bluetooth",
        iconWidget: iconImage,
        listContent: deviceListBox,
        onMainClick: togglePower,
        onToggleOpen: (isOpen) => {
            if (isOpen) updateDevicesList()
        },
        subtitleMaxWidthChars: 12,
    })

    const updateDevicesList = () => {
        let child = deviceListBox.get_first_child()
        while (child !== null) {
            const next = child.get_next_sibling()
            deviceListBox.remove(child)
            child = next
        }

        const devices = getDevices()
        const pairedBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4 })
        const availableBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4 })

        pairedBox.append(new Gtk.Label({ label: "Appareils appairés", halign: Gtk.Align.START, cssClasses: ["qs-subtitle"] }))
        availableBox.append(new Gtk.Label({ label: "Autres appareils", halign: Gtk.Align.START, cssClasses: ["qs-subtitle"] }))

        let hasPaired = false
        let hasAvailable = false

        for (const dev of devices) {
            if (dev.paired) {
                pairedBox.append(createDeviceRow(dev, updateDevicesList))
                hasPaired = true
            } else {
                availableBox.append(createDeviceRow(dev, updateDevicesList))
                hasAvailable = true
            }
        }

        if (hasPaired) deviceListBox.append(pairedBox)
        if (hasAvailable) deviceListBox.append(availableBox)
    }

    const updateUI = () => {
        const powered = isBluetoothPowered()
        if (powered) {
            menu.setActive(true)
            const devices = getDevices()
            const connected = devices.find(d => d.connected)
            menu.setSubtitle(connected ? connected.name : "Activé")
        } else {
            menu.setActive(false)
            menu.setSubtitle("Désactivé")
        }
    }

    updateUI()

    return menu.wrapper
}

function createDeviceRow(device: BluetoothDevice, onRefresh: () => void) {
    const rowBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        cssClasses: ["qs-ap-item"],
        marginStart: 4, marginEnd: 4,
    })

    const topBox = new Gtk.Box({ spacing: 8 })
    const icon = new Gtk.Image({ iconName: "bluetooth-active-symbolic", pixelSize: 18 })
    const label = new Gtk.Label({
        label: device.name || device.mac,
        hexpand: true,
        halign: Gtk.Align.START,
        cssClasses: device.connected ? ["qs-ap-label", "active"] : ["qs-ap-label"],
    })

    topBox.append(icon)
    topBox.append(label)

    const toggleBtn = new Gtk.Button({ child: topBox, cssClasses: ["qs-ap-toggle"] })

    const actionsBox = new Gtk.Box({ spacing: 8, marginTop: 8, marginBottom: 4 })
    const revealer = new Gtk.Revealer({
        transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
        child: actionsBox,
        revealChild: device.connected,
    })

    toggleBtn.connect("clicked", () => revealer.set_reveal_child(!revealer.get_reveal_child()))

    if (device.connected) {
        const disconnectBtn = new Gtk.Button({ label: "Déconnecter", cssClasses: ["qs-ap-btn"] })
        disconnectBtn.connect("clicked", () => {
            GLib.spawn_command_line_async(`bluetoothctl disconnect ${device.mac}`)
            revealer.set_reveal_child(false)
            setTimeout(onRefresh, 600)
        })

        const removeBtn = new Gtk.Button({ label: "Oublier", cssClasses: ["qs-ap-btn", "danger"] })
        removeBtn.connect("clicked", () => {
            GLib.spawn_command_line_async(`bluetoothctl remove ${device.mac}`)
            revealer.set_reveal_child(false)
            setTimeout(onRefresh, 600)
        })

        actionsBox.append(disconnectBtn)
        actionsBox.append(removeBtn)
    } else if (device.paired) {
        const connectBtn = new Gtk.Button({ label: "Connecter", cssClasses: ["qs-ap-btn", "active"] })
        connectBtn.connect("clicked", () => {
            GLib.spawn_command_line_async(`bluetoothctl connect ${device.mac}`)
            setTimeout(onRefresh, 1000)
        })

        const removeBtn = new Gtk.Button({ label: "Oublier", cssClasses: ["qs-ap-btn", "danger"] })
        removeBtn.connect("clicked", () => {
            GLib.spawn_command_line_async(`bluetoothctl remove ${device.mac}`)
            setTimeout(onRefresh, 600)
        })

        actionsBox.append(connectBtn)
        actionsBox.append(removeBtn)
    } else {
        const pairBtn = new Gtk.Button({ label: "Appairer", cssClasses: ["qs-ap-btn", "active"] })
        pairBtn.connect("clicked", () => {
            GLib.spawn_command_line_async(`bluetoothctl pair ${device.mac}`)
            setTimeout(onRefresh, 1200)
        })
        actionsBox.append(pairBtn)
    }

    rowBox.append(toggleBtn)
    rowBox.append(revealer)

    return rowBox
}