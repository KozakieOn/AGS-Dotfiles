import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"

export default function ShutdownBtn() {
    const configDir = GLib.get_user_config_dir()
    const assetsPath = `${configDir}/ags/assets/Shutdown`

    // 1. Icône principale du bouton
    const mainIcon = new Gtk.Image({
        file: `${assetsPath}/shutdown.svg`,
        pixel_size: 18,
    })

    // On utilise Gtk.MenuButton pour pouvoir y attacher un Popover flottant
    const button = new Gtk.MenuButton({
        child: mainIcon,
        valign: Gtk.Align.CENTER,
        halign: Gtk.Align.CENTER,
    })
    button.add_css_class("power-button")

    // 2. Le contenu du menu qui va flotter
    const menuBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 6,
        margin_top: 8,
        margin_bottom: 8,
        margin_start: 8,
        margin_end: 8,
    })
    menuBox.add_css_class("power-options-container")

    // Fonction pour créer les boutons d'option avec leurs icônes
    const createMenuButton = (iconName: string, command: string, popover: Gtk.Popover) => {
        const icon = new Gtk.Image({
            file: `${assetsPath}/${iconName}`,
            pixel_size: 16,
        })
        const btn = new Gtk.Button({ child: icon })
        btn.add_css_class("power-item")
        btn.connect("clicked", () => {
            GLib.spawn_command_line_async(command)
            popover.popdown() // Ferme le menu flottant après le clic
        })
        return btn
    }

    // 3. Création du Popover (la "fenêtre" flottante)
    const popover = new Gtk.Popover({
        child: menuBox,
        has_arrow: false,
    })
    popover.add_css_class("power_popover")

    // Création des 3 options avec les commandes demandées
    const lockBtn = createMenuButton("lock.svg", "hyprlock", popover)
    const rebootBtn = createMenuButton("reboot.svg", "systemctl reboot", popover)
    const shutdownBtn = createMenuButton("shutdown.svg", "systemctl poweroff", popover)

    menuBox.append(lockBtn)
    menuBox.append(rebootBtn)
    menuBox.append(shutdownBtn)

    // Association du popover au bouton de la barre
    button.set_popover(popover)

    return button
}