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
        } = options

        // --- Bouton principal ---
        this.mainButton = new Gtk.Button({
        cssClasses: ["qs-toggle-main"],
        hexpand: true,
    })

    const titleLabel = new Gtk.Label({
        label: title,
        halign: Gtk.Align.START,
        cssClasses: ["qs-title"],
        ellipsize:3,
        hexpand: true,
    })

    this.subtitleLabel = new Gtk.Label({
        halign: Gtk.Align.START,
        cssClasses: ["qs-subtitle"],
        ellipsize:3,
        hexpand:true,
    })

    const textBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        valign: Gtk.Align.CENTER,
        hexpand: true,
    })
    textBox.append(titleLabel)
    textBox.append(this.subtitleLabel)

    const mainContentBox = new Gtk.Box({
        spacing: 6,
        valign: Gtk.Align.CENTER,
        halign: Gtk.Align.START,
        marginStart: 8,
        marginEnd: 0,
        hexpand: true,
    })
    mainContentBox.append(iconWidget)
    mainContentBox.append(textBox)
    this.mainButton.set_child(mainContentBox)
    this.mainButton.connect("clicked", onMainClick)

        // --- Bouton Flèche ---
        const arrowImage = new Gtk.Image({ iconName: "pan-down-symbolic", pixelSize: 16 })
        const arrowButton = new Gtk.Button({
            cssClasses: ["qs-toggle-arrow"],
            child: arrowImage,
            widthRequest: 32,
            halign:Gtk.Align.CENTER,
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
        })
        splitButtonBox.append(this.mainButton)
        splitButtonBox.append(arrowButton)

        this.wrapper = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 8,
            valign: Gtk.Align.START,
            vexpand: false,
            widthRequest:170,
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