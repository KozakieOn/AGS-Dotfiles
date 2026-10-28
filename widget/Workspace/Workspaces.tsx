import { Gtk } from "ags/gtk4"
import AstalHyprland from "gi://AstalHyprland"
import GLib from "gi://GLib"
import Gio from "gi://Gio"

interface ClientItem {
    class?: string
    initialClass?: string
    workspace?: {
        id: number
    }
}

// Auto-génération du dictionnaire via les fichiers .desktop (style Wofi)
const generateIconCache = (): { [key: string]: string } => {
    const cache: { [key: string]: string } = {}
    const dirs = [
        "/usr/share/applications",
        GLib.get_user_data_dir() + "/applications",
        "/var/lib/flatpak/exports/share/applications",
        GLib.get_home_dir() + "/.local/share/flatpak/exports/share/applications"
    ]

    dirs.forEach(dirPath => {
        try {
            const dir = Gio.File.new_for_path(dirPath)
            const enumerator = dir.enumerate_children("standard::name,standard::type", Gio.FileQueryInfoFlags.NONE, null)
            
            let info
            while ((info = enumerator.next_file(null)) !== null) {
                const fileName = info.get_name()
                if (!fileName.endsWith(".desktop")) continue

                const filePath = `${dirPath}/${fileName}`
                const [success, contents] = GLib.file_get_contents(filePath)
                if (!success) continue

                const text = new TextDecoder().decode(contents)
                let wmClass = ""
                let iconName = ""

                text.split("\n").forEach(line => {
                    const trimmed = line.trim()
                    if (trimmed.startsWith("StartupWMClass=")) {
                        wmClass = trimmed.substring("StartupWMClass=".length).trim().toLowerCase()
                    } else if (trimmed.startsWith("Icon=")) {
                        iconName = trimmed.substring("Icon=".length).trim()
                    }
                })

                if (iconName) {
                    if (wmClass) {
                        cache[wmClass] = iconName
                    }
                    const baseName = fileName.replace(".desktop", "").toLowerCase()
                    cache[baseName] = iconName
                }
            }
        } catch (e) {
            // Ignore les dossiers inexistants
        }
    })

    return cache
}

const ICON_CACHE = generateIconCache()

const getIconName = (client: ClientItem): string => {
    const rawClass = client.initialClass || client.class || ""
    if (!rawClass) return "application-x-executable"
    
    const name = rawClass.toLowerCase().trim()

    if (ICON_CACHE[name]) {
        return ICON_CACHE[name]
    }

    if (name.startsWith("steam_app_")) {
        const appId = name.replace("steam_app_", "")
        return `steam_icon_${appId}`
    }

    return name
}

export default function Workspace() {
    const hyprland = AstalHyprland.get_default()

    const box = new Gtk.Box({
        css_classes: ["workspace_container"],
        spacing: 6,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        height_request: 43,
    })

    const updateWorkspaces = () => {
        let child = box.get_first_child()
        while (child !== null) {
            const next = child.get_next_sibling()
            box.remove(child)
            child = next
        }

        const workspaces = [...hyprland.get_workspaces()]
            .sort((a, b) => a.id - b.id)
            .slice(0, 5)

        const clients = hyprland.get_clients()
        const focusedWs = hyprland.get_focused_workspace()

        workspaces.forEach(ws => {
            const wsButton = new Gtk.Button({
                css_classes: ["workspace_btn"],
            })

            if (focusedWs && focusedWs.id === ws.id) {
                wsButton.add_css_class("active")
            }

            const contentBox = new Gtk.Box({
                spacing: 6,
                halign: Gtk.Align.CENTER,
                valign: Gtk.Align.CENTER,
            })

            const label = new Gtk.Label({
                label: `${ws.name}`,
            })
            label.add_css_class("workspace_label")
            contentBox.append(label)

            const wsClients = clients.filter(c => c.workspace && c.workspace.id === ws.id)
            if (wsClients.length > 0) {
                const iconsBox = new Gtk.Box({
                    spacing: 4,
                    halign: Gtk.Align.CENTER,
                    valign: Gtk.Align.CENTER,
                })
                iconsBox.add_css_class("workspace_icons")

                const maxIcons = 1
                const displayedClients = wsClients.slice(0, maxIcons)

                displayedClients.forEach(client => {
                    const iconName = getIconName(client as ClientItem)
                    const icon = new Gtk.Image({
                        icon_name: iconName,
                        pixel_size: 30,
                    })
                    iconsBox.append(icon)
                })

                // CORRECTION DU BUG DE SYNTAXE ICI (- maxIcons)
                if (wsClients.length > maxIcons) {
                    const moreLabel = new Gtk.Label({
                        label: `+${wsClients.length - maxIcons}`,
                    })
                    moreLabel.add_css_class("workspace_more_label")
                    iconsBox.append(moreLabel)
                }

                contentBox.append(iconsBox)
            }

            wsButton.set_child(contentBox)

            // Clic gauche : Changer de workspace
            wsButton.connect("clicked", () => {
                GLib.spawn_command_line_async(`hyprctl dispatch 'hl.dsp.focus({ workspace = ${ws.id} })'`) 
            })

            // Clic droit (GestureClick) : Action personnalisée (ex: fermer/tuer les fenêtres du workspace)
            const clickController = new Gtk.GestureClick({ button: 3 })

            clickController.connect("pressed", () => {
                const wsClients = hyprland.get_clients()
                    .filter(c => c.workspace?.id === ws.id)

                wsClients.forEach(client => {
                    const address = String(client.address)
                    const windowAddress = address.startsWith("0x")
                        ? address
                        : `0x${address}`

                    GLib.spawn_command_line_async(
                        `hyprctl dispatch "hl.dsp.window.close({ window = 'address:${windowAddress}' })"`
                    )
                })
            })

            wsButton.add_controller(clickController)

            box.append(wsButton)
        })
    }

    hyprland.connect("notify::workspaces", updateWorkspaces)
    hyprland.connect("notify::clients", updateWorkspaces)
    hyprland.connect("notify::focused-workspace", updateWorkspaces)

    updateWorkspaces()

    return box
}