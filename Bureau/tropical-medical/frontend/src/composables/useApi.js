import { useAuthStore } from '../stores/auth.js'

const API = import.meta.env.VITE_API_URL

export function useApi() {
  const auth = useAuthStore()

  const headers = () => ({
    'Content-Type': 'application/json',
    ...auth.entetes(),
  })

  async function _handle(res) {
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      throw new Error(e.message || `Erreur ${res.status}`)
    }
    return res.json()
  }

  const get   = (path)       => fetch(`${API}${path}`, { headers: auth.entetes() }).then(_handle)
  const post  = (path, body) => fetch(`${API}${path}`, { method: 'POST',   headers: headers(), body: JSON.stringify(body) }).then(_handle)
  const put   = (path, body) => fetch(`${API}${path}`, { method: 'PUT',    headers: headers(), body: JSON.stringify(body) }).then(_handle)
  const patch = (path, body) => fetch(`${API}${path}`, { method: 'PATCH',  headers: headers(), body: JSON.stringify(body) }).then(_handle)
  const del   = (path)       => fetch(`${API}${path}`, { method: 'DELETE', headers: auth.entetes() }).then(_handle)

  return { get, post, put, patch, del }
}
