import GLib from "gi://GLib"

class BrightnessService {
    private _listeners: (() => void)[] = []
    private _screen = 0.5

    constructor() {
        this.syncFromSystem()
        this.listenToSystemChanges()
    }

    get screen(): number {
        return this._screen
    }

    set screen(val: number) {
        const percent = Math.max(0, Math.min(100, Math.round(val * 100)))
        GLib.spawn_command_line_async(`brightnessctl set ${percent}%`)
        this._screen = val
        this.notify()
    }

    connect(_signal: string, callback: () => void) {
        this._listeners.push(callback)
    }

    private notify() {
        for (const cb of this._listeners) cb()
    }

    private syncFromSystem() {
        try {
            const [success, stdout] = GLib.spawn_command_line_sync("brightnessctl i -m")
            if (!success || !stdout) return
            
            const output = new TextDecoder().decode(stdout)
            const parts = output.split(",")
            
            // CORRECTION : L'index 3 contient le pourcentage (ex: "50%")
            if (parts[3]) {
                this._screen = parseInt(parts[3].replace("%", "")) / 100
            }
        } catch {
            // Sécurité en cas d'erreur de lecture
        }
    }

    private listenToSystemChanges() {
        // CORRECTION : Boucle de vérification légère toutes les 250ms
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
            const oldVal = this._screen
            
            this.syncFromSystem()
            
            // Si la luminosité a changé (avec une marge d'erreur pour éviter les bugs)
            if (Math.abs(oldVal - this._screen) > 0.01) {
                this.notify()
            }
            
            // Retourner SOURCE_CONTINUE permet à la boucle de tourner indéfiniment
            return GLib.SOURCE_CONTINUE
        })
    }
}

const instance = new BrightnessService()
export default {
    get_default: () => instance
}