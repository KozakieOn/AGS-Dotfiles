import { Gtk } from "ags/gtk4"

export interface QsMenuItemOptions {
    title: string
    iconWidget: Gtk.Widget
    listContent: Gtk.Widget
    onMainClick: () => void
    onToggleOpen?: (isOpen: boolean) => void
    subtitleMaxWidthChars?: number
}

export class QsMenuItem {
    public wrapper: Gtk.Box
    public subtitleLabel: Gtk.Label
    public mainButton: Gtk.Button
    private isOpen = false

    constructor(options: QsMenuItemOptions) {
        const {
            title,
            iconWidget,
            listContent,
            onMainClick,
            onToggleOpen,
            subtitleMaxWidthChars = 14,
        } = options

        // --- Bouton principal ---
        this.mainButton = new Gtk.Button({
            cssClasses: ["qs-toggle-main"],
        })

        const titleLabel = new Gtk.Label({
            label: title,
            halign: Gtk.Align.START,
            cssClasses: ["qs-title"],
        })

        this.subtitleLabel = new Gtk.Label({
            halign: Gtk.Align.START,
            cssClasses: ["qs-subtitle"],
            maxWidthChars: subtitleMaxWidthChars,
            ellipsize: 3,
            lines: 1,
        })

        const textBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            valign: Gtk.Align.CENTER,
        })
        textBox.append(titleLabel)
        textBox.append(this.subtitleLabel)

        const textRevealer = new Gtk.Revealer({
            transitionType: Gtk.RevealerTransitionType.SLIDE_RIGHT,
            transitionDuration: 250,
            revealChild: false,
        })
        textRevealer.set_child(textBox)

        const mainContentBox = new Gtk.Box({
            spacing: 12,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.START,
            marginStart: 8,
            marginEnd: 8,
        })
        mainContentBox.append(iconWidget)
        mainContentBox.append(textRevealer)
        this.mainButton.set_child(mainContentBox)
        this.mainButton.connect("clicked", onMainClick)

        // --- Bouton Flèche ---
        const arrowImage = new Gtk.Image({ iconName: "pan-down-symbolic", pixelSize: 16 })
        const arrowButton = new Gtk.Button({
            cssClasses: ["qs-toggle-arrow"],
            child: arrowImage,
        })

        const dropdownRevealer = new Gtk.Revealer({
            transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
            transitionDuration: 250,
            revealChild: false,
        })

        // --- Conteneur Liste & ScrolledWindow ---
        const scrolledWindow = new Gtk.ScrolledWindow({
            minContentHeight: 180,
            maxContentHeight: 200,
            propagateNaturalHeight: true,
            hscrollbarPolicy: Gtk.PolicyType.NEVER,
            cssClasses: ["qs-wifi-scroll"],
        })
        scrolledWindow.set_child(listContent)

        const listContainer = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 4,
            cssClasses: ["qs-wifi-list-container"],
        })
        listContainer.append(scrolledWindow)
        dropdownRevealer.set_child(listContainer)

        // --- Assemblage Split Button ---
        const splitButtonBox = new Gtk.Box({
            cssClasses: ["qs-split-button"],
            halign: Gtk.Align.START,
        })
        splitButtonBox.append(this.mainButton)
        splitButtonBox.append(arrowButton)

        this.wrapper = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 8,
            valign: Gtk.Align.START,
            vexpand: false,
        })
        this.wrapper.append(splitButtonBox)
        this.wrapper.append(dropdownRevealer)

        // --- Gestion de la taille de la fenêtre Wayland ---
        arrowButton.connect("clicked", () => {
            this.isOpen = !this.isOpen

            const root = this.wrapper.get_root() as Gtk.Window | null
            if (this.isOpen && root) {
                root.set_default_size(-1, -1)
            }

            dropdownRevealer.set_reveal_child(this.isOpen)
            textRevealer.set_reveal_child(this.isOpen)
            arrowImage.set_from_icon_name(this.isOpen ? "pan-up-symbolic" : "pan-down-symbolic")

            if (onToggleOpen) {
                onToggleOpen(this.isOpen)
            }
        })

        const requestShrink = () => {
            if (!this.isOpen) {
                const root = this.wrapper.get_root() as Gtk.Window | null
                if (root) {
                    root.set_default_size(1, 1)
                }
            }
        }

        dropdownRevealer.connect("notify::child-revealed", () => {
            if (!dropdownRevealer.get_child_revealed() && !this.isOpen) requestShrink()
        })

        textRevealer.connect("notify::child-revealed", () => {
            if (!textRevealer.get_child_revealed() && !this.isOpen) requestShrink()
        })
    }

    public setSubtitle(text: string) {
        this.subtitleLabel.set_label(text)
    }

    public setActive(active: boolean) {
        if (active) {
            this.mainButton.add_css_class("active")
        } else {
            this.mainButton.remove_css_class("active")
        }
    }
}