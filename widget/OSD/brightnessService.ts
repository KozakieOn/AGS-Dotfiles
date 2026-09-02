import GLib from "gi://GLib"

class BrightnessService {
    private _listeners: (() => void)[] = []
    private _screen = 0.5
    private _minBrightness = 0.02
    private _curve = 2.5         // La courbe logarithmique
    private _lastSentPercent = -1

    constructor() {
        this.syncFromSystem()
        this.listenToSystemChanges()
    }

    // Conversion Physique -> Visuel (avec la courbe inversée pour le slider)
    get screen(): number {
        const raw = Math.max(this._minBrightness, Math.min(1, this._screen))
        const normalized = (raw - this._minBrightness) / (1 - this._minBrightness)
        return Math.pow(Math.max(0, normalized), 1 / this._curve)
    }

    // Conversion Visuel -> Physique (avec la courbe exponentielle)
    set screen(val: number) {
        const clampedVal = Math.max(0, Math.min(1, val))
        const curvedVal = Math.pow(clampedVal, this._curve)
        const hwValue = this._minBrightness + (1 - this._minBrightness) * curvedVal
        
        const percent = Math.max(2, Math.min(100, Math.round(hwValue * 100)))

        this._screen = hwValue

        if (this._lastSentPercent !== percent) {
            this._lastSentPercent = percent
            GLib.spawn_command_line_async(`brightnessctl set ${percent}%`)
        }

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

            const output = new TextDecoder().decode(stdout).trim()
            const parts = output.split(",")
            const percentPart = parts.find((p) => p.includes("%"))
            
            if (percentPart) {
                const parsed = parseInt(percentPart.replace("%", ""), 10)
                if (!isNaN(parsed)) {
                    this._screen = parsed / 100
                    this._lastSentPercent = parsed
                }
            }
        } catch {
            // Sécurité de lecture
        }
    }

    private listenToSystemChanges() {
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
            const oldVal = this._screen
            this.syncFromSystem()

            // Si la luminosité change via tes raccourcis F5/F6, on déclenche l'OSD
            if (Math.abs(oldVal - this._screen) > 0.005) {
                this.notify()
            }
            return GLib.SOURCE_CONTINUE
        })
    }
}

const instance = new BrightnessService()
export default {
    get_default: () => instance
}