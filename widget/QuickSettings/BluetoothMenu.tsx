import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"

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

    // --- Bouton principal ---
    const mainButton = new Gtk.Button({
        hexpand: true,
        cssClasses: ["qs-toggle-main"],
    })

    const iconImage = new Gtk.Image({ iconName: "bluetooth-active-symbolic", pixelSize: 24 })
    const titleLabel = new Gtk.Label({ label: "Bluetooth", halign: Gtk.Align.START, cssClasses: ["qs-title"] })
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

    mainButton.connect("clicked", togglePower)

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
        if (isOpen) updateDevicesList()
    })

    // --- Liste des appareils ---
    const deviceListBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 2,
    })

    const scrolledWindow = new Gtk.ScrolledWindow({
        heightRequest: 200,
        cssClasses: ["qs-wifi-scroll"],
    })
    scrolledWindow.set_child(deviceListBox)

    const listContainer = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 4,
        cssClasses: ["qs-wifi-list-container"],
    })
    listContainer.append(scrolledWindow)
    revealer.set_child(listContainer)

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
            mainButton.add_css_class("active")
            const devices = getDevices()
            const connected = devices.find(d => d.connected)
            subtitleLabel.set_label(connected ? connected.name : "Activé")
        } else {
            mainButton.remove_css_class("active")
            subtitleLabel.set_label("Désactivé")
        }
    }

    updateUI()

    // --- Assemblage final ---
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