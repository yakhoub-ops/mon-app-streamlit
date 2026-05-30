import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patient.service';
import Spinner from '../../components/ui/Spinner';

function PatientCard({ patient, onReset }) {
  const navigate = useNavigate();

  const initials = (patient.prenom?.[0] || '') + (patient.nom?.[0] || '');
  const age = patient.date_naissance
    ? Math.floor((Date.now() - new Date(patient.date_naissance)) / 31557600000)
    : null;

  const allergieListe = patient.allergies
    ? patient.allergies.split(',').map(a => a.trim()).filter(Boolean)
    : [];

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(7,241,19,0.10)',
    }}>
      {/* Header vert */}
      <div style={{
        background: 'linear-gradient(135deg, #07f113 0%, #04b30e 100%)',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '800', fontSize: '1.3rem', color: '#fff', flexShrink: 0,
        }}>{initials}</div>
        <div>
          <p style={{ fontWeight: '800', fontSize: '1.15rem', color: '#fff', lineHeight: 1.2 }}>
            {patient.prenom} {patient.nom}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', marginTop: 2 }}>
            {patient.numero_dossier}
            {age !== null && ` · ${age} ans`}
          </p>
        </div>
        <span style={{
          marginLeft: 'auto', background: 'rgba(255,255,255,0.25)',
          color: '#fff', borderRadius: 8, padding: '4px 12px',
          fontWeight: '700', fontSize: '0.85rem',
        }}>
          {patient.groupe_sanguin || '—'}
        </span>
      </div>

      {/* Infos */}
      <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {[
          { label: 'Téléphone',     value: patient.telephone || '—' },
          { label: 'Sexe',          value: patient.sexe === 'M' ? 'Masculin' : patient.sexe === 'F' ? 'Féminin' : '—' },
          { label: 'Adresse',       value: patient.adresse || '—' },
          { label: 'Email',         value: patient.email || '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            <p style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text)', marginTop: 2 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Allergies */}
      {allergieListe.length > 0 && (
        <div style={{ padding: '0 1.25rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Allergies
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allergieListe.map(a => (
              <span key={a} style={{
                background: '#fff1f0', border: '1px solid #ffa39e',
                color: '#cf1322', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: '600',
              }}>{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Antécédents */}
      {patient.antecedents && (
        <div style={{ padding: '0 1.25rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Antécédents
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{patient.antecedents}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: '0.65rem', flexWrap: 'wrap',
      }}>
        <button
          onClick={() => navigate('/receptionniste/file-attente', { state: { patient } })}
          style={btnStyle('#07f113', '#fff')}
        >
          🧍 File d&apos;attente
        </button>
        <button
          onClick={() => navigate('/receptionniste/dashboard', { state: { openRdv: true, patient } })}
          style={btnStyle('var(--surface2)', 'var(--text)', true)}
        >
          📅 Nouveau RDV
        </button>
        <button onClick={onReset} style={btnStyle('var(--surface2)', 'var(--muted)', true)}>
          📷 Scanner un autre
        </button>
      </div>
    </div>
  );
}

function btnStyle(bg, color, border = false) {
  return {
    padding: '0.55rem 1rem',
    background: bg, color,
    border: border ? '1px solid var(--border)' : 'none',
    borderRadius: 10, cursor: 'pointer',
    fontWeight: '600', fontSize: '0.85rem',
    transition: 'opacity 0.15s',
  };
}

export default function ScannerQR() {
  const [scanning, setScanning]   = useState(false);
  const [patient, setPatient]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [manualId, setManualId]   = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 240, height: 240 }, rememberLastUsedCamera: true },
      false
    );

    scanner.render(
      async (decodedText) => {
        await scanner.clear().catch(() => {});
        scannerRef.current = null;
        setScanning(false);
        await loadPatient(decodedText.trim());
      },
      () => {}
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  const loadPatient = async (raw) => {
    setLoading(true);
    setError('');
    setPatient(null);
    try {
      const id = parseInt(raw, 10);
      if (isNaN(id) || id <= 0) throw new Error('QR invalide');
      const res = await patientService.getOne(id);
      setPatient(res.data);
    } catch {
      setError('Patient introuvable ou QR code invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleManual = (e) => {
    e.preventDefault();
    if (manualId.trim()) loadPatient(manualId.trim());
  };

  const reset = () => {
    setPatient(null);
    setError('');
    setManualId('');
    setScanning(false);
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 640, margin: '0 auto' }}>
      {/* Titre */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--text)', margin: 0 }}>
          📷 Scanner carte patient
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: 4 }}>
          Scannez le QR code de la carte pour identifier le patient instantanément.
        </p>
      </div>

      {/* Zone scanner */}
      {!patient && !loading && (
        <>
          {!scanning ? (
            <div style={{
              background: 'var(--surface)',
              border: '2px dashed var(--border)',
              borderRadius: 16,
              padding: '3rem 2rem',
              textAlign: 'center',
              marginBottom: '1.25rem',
            }}>
              <p style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📷</p>
              <p style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text)', marginBottom: 8 }}>
                Prêt à scanner
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Cliquez pour activer la caméra et pointer vers le QR code
              </p>
              <button
                onClick={() => { setError(''); setScanning(true); }}
                style={{
                  background: '#07f113', color: '#fff', border: 'none',
                  borderRadius: 12, padding: '0.75rem 2rem',
                  fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
                }}
              >
                Démarrer le scanner
              </button>
              {error && (
                <p style={{
                  marginTop: '1rem', color: '#cf1322', fontWeight: '600', fontSize: '0.88rem',
                  background: '#fff1f0', padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #ffa39e',
                }}>{error}</p>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: '1.25rem' }}>
              <div id="qr-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />
              <button
                onClick={() => {
                  if (scannerRef.current) {
                    scannerRef.current.clear().catch(() => {});
                    scannerRef.current = null;
                  }
                  setScanning(false);
                }}
                style={{
                  marginTop: '0.75rem', width: '100%', padding: '0.55rem',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 10, cursor: 'pointer', color: 'var(--muted)', fontWeight: '600',
                }}
              >
                ✕ Annuler
              </button>
            </div>
          )}

          {/* Saisie manuelle */}
          <form onSubmit={handleManual} style={{
            display: 'flex', gap: '0.6rem',
            background: 'var(--surface)', padding: '1rem', borderRadius: 12,
            border: '1px solid var(--border)',
          }}>
            <input
              type="number"
              value={manualId}
              onChange={e => setManualId(e.target.value)}
              placeholder="ID patient (saisie manuelle)"
              min="1"
              style={{
                flex: 1, padding: '0.6rem 0.85rem',
                border: '1px solid var(--border)', borderRadius: 8,
                fontSize: '0.88rem', background: 'var(--surface2)', color: 'var(--text)',
              }}
            />
            <button type="submit" style={{
              padding: '0.6rem 1.1rem', background: 'var(--g3)',
              border: '1px solid var(--g)', color: 'var(--g)',
              borderRadius: 8, fontWeight: '700', cursor: 'pointer',
            }}>
              Rechercher
            </button>
          </form>
        </>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Spinner size={40} />
          <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Chargement du patient…</p>
        </div>
      )}

      {patient && <PatientCard patient={patient} onReset={reset} />}
    </div>
  );
}
