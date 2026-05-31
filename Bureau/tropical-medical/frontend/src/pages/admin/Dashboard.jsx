import { useState, useEffect, useCallback } from 'react';
import { utilisateurService } from '../../services/utilisateur.service';
import Card   from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge  from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

/* ── Styles communs ── */
const inp = {
  padding: '0.65rem 0.9rem',
  border: '1.5px solid var(--border)',
  borderRadius: '10px',
  fontSize: '0.9rem',
  width: '100%',
  outline: 'none',
  background: 'var(--surface2)',
  color: 'var(--text)',
  transition: 'border-color .2s',
};
const lbl = {
  fontSize: '0.78rem', fontWeight: '700',
  color: 'var(--muted)', display: 'block', marginBottom: '0.3rem',
};
const sel = { ...inp, cursor: 'pointer' };

/* ── Config rôles ── */
const ROLES = [
  { value: '',               label: 'Tous les rôles' },
  { value: 'medecin',        label: 'Médecin' },
  { value: 'patient',        label: 'Patient' },
  { value: 'receptionniste', label: 'Réceptionniste' },
  { value: 'pharmacien',     label: 'Pharmacien' },
  { value: 'admin',          label: 'Administrateur' },
];

const ROLE_COLORS = {
  medecin:        { color: '#0d6efd', bg: '#e7f0ff' },
  patient:        { color: '#198754', bg: '#d1e7dd' },
  receptionniste: { color: '#6f42c1', bg: '#ede7f6' },
  pharmacien:     { color: '#fd7e14', bg: '#fff3cd' },
  admin:          { color: '#dc3545', bg: '#fde8e8' },
};

const ROLE_LABEL = {
  medecin:        'Médecin',
  patient:        'Patient',
  receptionniste: 'Réceptionniste',
  pharmacien:     'Pharmacien',
  admin:          'Admin',
};

/* ── Carte stat ── */
function StatCard({ icon, label, value, color = '#07f113', alert }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1.5px solid ${alert ? '#e74c3c33' : 'var(--border)'}`,
      borderRadius: '14px',
      padding: '1.1rem 1.2rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '12px',
        background: alert ? '#fde8e8' : `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <p style={{ fontSize: '1.6rem', fontWeight: '800', color: alert ? '#e74c3c' : color, lineHeight: 1 }}>
          {value ?? '…'}
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>{label}</p>
      </div>
    </div>
  );
}

/* ── Modal création utilisateur ── */
const EMPTY_FORM = { nom: '', prenom: '', email: '', telephone: '', role: 'patient', mot_de_passe: '' };

function ModalCreate({ onClose, onSaved }) {
  const [form, setForm]     = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await utilisateurService.create(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: '18px',
        padding: '1.8rem', width: '100%', maxWidth: 480,
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        <h3 style={{ margin: '0 0 1.2rem', fontWeight: '800' }}>Nouvel utilisateur</h3>
        {error && (
          <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.7rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={lbl}>Nom *</label>
              <input style={inp} value={form.nom} onChange={e => set('nom', e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>Prénom *</label>
              <input style={inp} value={form.prenom} onChange={e => set('prenom', e.target.value)} required />
            </div>
          </div>
          <div>
            <label style={lbl}>Email *</label>
            <input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div>
            <label style={lbl}>Téléphone *</label>
            <input style={inp} value={form.telephone} onChange={e => set('telephone', e.target.value)} required />
          </div>
          <div>
            <label style={lbl}>Rôle *</label>
            <select style={sel} value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.filter(r => r.value).map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Mot de passe (défaut : tropical123)</label>
            <input style={inp} type="password" placeholder="tropical123" value={form.mot_de_passe} onChange={e => set('mot_de_passe', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit" loading={saving}>Créer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal reset mot de passe ── */
function ModalReset({ user, onClose, onDone }) {
  const [pwd, setPwd]       = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pwd) return;
    setSaving(true); setError('');
    try {
      await utilisateurService.resetPassword(user.id_util, pwd);
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: '18px',
        padding: '1.8rem', width: '100%', maxWidth: 400,
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        <h3 style={{ margin: '0 0 0.4rem', fontWeight: '800' }}>Réinitialiser le mot de passe</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
          {user.prenom} {user.nom}
        </p>
        {error && (
          <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.7rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={lbl}>Nouveau mot de passe *</label>
            <input style={inp} type="password" value={pwd} onChange={e => setPwd(e.target.value)} required autoFocus />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit" loading={saving}>Enregistrer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Composant principal ── */
export default function AdminDashboard() {
  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [usersLoad,  setUsersLoad]  = useState(false);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal,      setModal]      = useState(null); // 'create' | { type:'reset', user }
  const [toast,      setToast]      = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  /* Chargement stats */
  useEffect(() => {
    utilisateurService.getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Chargement utilisateurs */
  const loadUsers = useCallback(() => {
    setUsersLoad(true);
    utilisateurService.getAll({ q: search || undefined, role: roleFilter || undefined })
      .then(setUsers)
      .catch(() => {})
      .finally(() => setUsersLoad(false));
  }, [search, roleFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  /* Activer / désactiver */
  const toggleActif = async (u) => {
    try {
      await utilisateurService.update(u.id_util, { actif: !u.actif });
      showToast(u.actif ? 'Utilisateur désactivé' : 'Utilisateur activé');
      loadUsers();
    } catch {
      showToast('Erreur lors de la mise à jour');
    }
  };

  const statsCards = stats ? [
    { icon: '👥', label: 'Utilisateurs actifs',   value: stats.total_utilisateurs },
    { icon: '🧑‍⚕️', label: 'Médecins',             value: stats.total_medecins },
    { icon: '🧑‍🦽', label: 'Patients',             value: stats.total_patients },
    { icon: '📅', label: "RDV aujourd'hui",        value: stats.rdv_aujourd_hui },
    { icon: '🩺', label: 'Consultations ce mois',  value: stats.consultations_mois },
    { icon: '💰', label: 'Factures impayées',       value: stats.factures_impayees, alert: stats.factures_impayees > 0 },
    { icon: '🚨', label: 'Urgences actives',        value: stats.urgences_actives,  alert: stats.urgences_actives > 0 },
    { icon: '📦', label: 'Médicaments en alerte',   value: stats.medicaments_alerte, alert: stats.medicaments_alerte > 0 },
  ] : [];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 2000,
          background: '#07f113', color: '#000', padding: '0.75rem 1.2rem',
          borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem',
          boxShadow: '0 4px 20px rgba(7,241,19,0.35)',
        }}>{toast}</div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: '800', fontSize: '1.4rem' }}>Tableau de bord</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>Vue d'ensemble de la plateforme</p>
        </div>
        <Button onClick={() => setModal('create')}>+ Nouvel utilisateur</Button>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '0.9rem',
          marginBottom: '2rem',
        }}>
          {statsCards.map((s, i) => <StatCard key={i} {...s} />)}
        </div>
      )}

      {/* Répartition par rôle */}
      {stats?.par_role?.length > 0 && (
        <Card style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: '800', fontSize: '1rem' }}>Répartition par rôle</h3>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {stats.par_role.map(r => {
              const cfg = ROLE_COLORS[r.role] || { color: '#666', bg: '#f5f5f5' };
              return (
                <div key={r.role} style={{
                  padding: '0.5rem 1rem', borderRadius: '20px',
                  background: cfg.bg, color: cfg.color,
                  fontWeight: '700', fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  <span>{ROLE_LABEL[r.role] || r.role}</span>
                  <span style={{
                    background: cfg.color, color: '#fff',
                    borderRadius: '50%', width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem',
                  }}>{r.nb}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Gestion des utilisateurs */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1rem' }}>Gestion des utilisateurs</h3>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              style={{ ...inp, width: 180 }}
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={{ ...sel, width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {usersLoad ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
        ) : users.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Aucun utilisateur trouvé.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.8rem', textAlign: 'left', color: 'var(--muted)', fontWeight: '700', fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const cfg = ROLE_COLORS[u.role] || { color: '#666', bg: '#f5f5f5' };
                  return (
                    <tr key={u.id_util} style={{ borderBottom: '1px solid var(--border)', opacity: u.actif ? 1 : 0.5 }}>
                      <td style={{ padding: '0.7rem 0.8rem', fontWeight: '600' }}>
                        {u.prenom} {u.nom}
                      </td>
                      <td style={{ padding: '0.7rem 0.8rem', color: 'var(--muted)' }}>{u.email}</td>
                      <td style={{ padding: '0.7rem 0.8rem', color: 'var(--muted)' }}>{u.telephone}</td>
                      <td style={{ padding: '0.7rem 0.8rem' }}>
                        <span style={{
                          padding: '0.2rem 0.7rem', borderRadius: '20px',
                          background: cfg.bg, color: cfg.color,
                          fontWeight: '700', fontSize: '0.75rem',
                        }}>{ROLE_LABEL[u.role] || u.role}</span>
                      </td>
                      <td style={{ padding: '0.7rem 0.8rem' }}>
                        <span style={{
                          padding: '0.2rem 0.7rem', borderRadius: '20px',
                          background: u.actif ? '#eafaf1' : '#fde8e8',
                          color: u.actif ? '#27ae60' : '#e74c3c',
                          fontWeight: '700', fontSize: '0.75rem',
                        }}>{u.actif ? 'Actif' : 'Inactif'}</span>
                      </td>
                      <td style={{ padding: '0.7rem 0.8rem', color: 'var(--muted)' }}>
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '0.7rem 0.8rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => toggleActif(u)}
                            title={u.actif ? 'Désactiver' : 'Activer'}
                            style={{
                              border: 'none', background: u.actif ? '#fde8e8' : '#eafaf1',
                              color: u.actif ? '#e74c3c' : '#27ae60',
                              padding: '0.35rem 0.6rem', borderRadius: '8px',
                              cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700',
                            }}
                          >{u.actif ? '🚫' : '✅'}</button>
                          <button
                            onClick={() => setModal({ type: 'reset', user: u })}
                            title="Réinitialiser le mot de passe"
                            style={{
                              border: 'none', background: 'var(--surface2)',
                              color: 'var(--muted)',
                              padding: '0.35rem 0.6rem', borderRadius: '8px',
                              cursor: 'pointer', fontSize: '0.8rem',
                            }}
                          >🔑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      {modal === 'create' && (
        <ModalCreate
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); showToast('Utilisateur créé avec succès'); loadUsers(); utilisateurService.getStats().then(setStats); }}
        />
      )}
      {modal?.type === 'reset' && (
        <ModalReset
          user={modal.user}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); showToast('Mot de passe réinitialisé'); }}
        />
      )}
    </div>
  );
}
