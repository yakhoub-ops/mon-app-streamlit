export function useDate() {
  function fmt(iso, opts = {}) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('fr-SN', {
      day: '2-digit', month: 'short', year: 'numeric', ...opts,
    })
  }

  function fmtHeure(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })
  }

  function fmtDateHeure(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    return `${fmt(iso)} à ${fmtHeure(iso)}`
  }

  function depuisMaintenant(iso) {
    if (!iso) return ''
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000)
    if (diff < 1)    return 'À l\'instant'
    if (diff < 60)   return `Il y a ${diff} min`
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`
    return fmt(iso)
  }

  function estPasse(iso) {
    return new Date(iso) < new Date()
  }

  function estAujourdhui(iso) {
    const d = new Date(iso)
    const n = new Date()
    return d.toDateString() === n.toDateString()
  }

  function minInputLocal(date = new Date()) {
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  return { fmt, fmtHeure, fmtDateHeure, depuisMaintenant, estPasse, estAujourdhui, minInputLocal }
}
