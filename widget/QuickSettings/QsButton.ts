import { Gtk } from "ags/gtk4"

export interface QsStateConfig<T = any> {
    value: T
    label: string
    subtitle?: string
    iconName?: string
    iconFile?: string
}

export interface QsButtonOptions<T = any> {
    title: string
    states: QsStateConfig<T>[]
    getValue: () => T
    onSelect: (newValue: T, triggerOSD: boolean) => void
}

export class QsButton<T = any> {
    public wrapper: Gtk.Button
    private iconImage: Gtk.Image
    private titleLabel: Gtk.Label
    private subtitleLabel: Gtk.Label
    private options: QsButtonOptions<T>

    constructor(options: QsButtonOptions<T>) {
        this.options = options

        this.iconImage = new Gtk.Image({ pixelSize: 24 })
        this.titleLabel = new Gtk.Label({
            label: options.title,
            halign: Gtk.Align.START,
            cssClasses: ["qs-title"],
            ellipsize: 3,
        })
        this.subtitleLabel = new Gtk.Label({
            halign: Gtk.Align.START,
            cssClasses: ["qs-subtitle"],
            ellipsize: 3,
        })

        const textBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            valign: Gtk.Align.CENTER,
            hexpand: true,
        })
        textBox.append(this.titleLabel)
        textBox.append(this.subtitleLabel)

        const contentBox = new Gtk.Box({
            spacing: 12,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.START,
            marginStart: 8,
            marginEnd: 8,
        })
        contentBox.append(this.iconImage)
        contentBox.append(textBox)

        this.wrapper = new Gtk.Button({
            cssClasses: ["qs-toggle-main"],
            child: contentBox,
            hexpand: true,
        })

        // Clic depuis les QuickSettings -> Trigger avec triggerOSD = false
        this.wrapper.connect("clicked", () => {
            const currentVal = this.options.getValue()
            const currentIndex = this.options.states.findIndex(s => s.value === currentVal)
            const nextIndex = (currentIndex + 1) % this.options.states.length
            const nextState = this.options.states[nextIndex]

            this.options.onSelect(nextState.value, false)
            this.updateUI()
        })

        this.updateUI()
    }

    public updateUI() {
        const currentVal = this.options.getValue()
        const stateConfig = this.options.states.find(s => s.value === currentVal) || this.options.states[0]

        if (stateConfig.iconFile) {
            this.iconImage.set_from_file(stateConfig.iconFile)
        } else if (stateConfig.iconName) {
            this.iconImage.set_from_icon_name(stateConfig.iconName)
        }

        this.subtitleLabel.set_label(stateConfig.subtitle || stateConfig.label)

        // Actif si true ou valeur non nulle/non-désactivée
        const isActive = typeof currentVal === "boolean" ? currentVal : currentVal !== "off"
        if (isActive) {
            this.wrapper.add_css_class("active")
        } else {
            this.wrapper.remove_css_class("active")
        }
    }
}