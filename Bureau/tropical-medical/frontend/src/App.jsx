import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header  from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Sidebar from './components/layout/Sidebar';
import Spinner from './components/ui/Spinner';

import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profil   from './pages/Profil';

import MedecinDashboard        from './pages/medecin/Dashboard';
import MedecinMesRdv           from './pages/medecin/MesRdv';
import MedecinFichePatient     from './pages/medecin/FichePatient';
import MedecinNouvelleConsult  from './pages/medecin/NouvelleConsultation';
import MedecinNouvelleOrdo     from './pages/medecin/NouvelleOrdonnance';
import MedecinTeleconsultation from './pages/medecin/Teleconsultation';
import MedecinUrgences          from './pages/medecin/Urgences';
import MedecinFactures           from './pages/medecin/Factures';

import PatientDashboard   from './pages/patient/Dashboard';
import PatientMesRdv      from './pages/patient/MesRdv';
import PatientMonDossier  from './pages/patient/MonDossier';
import PatientMesFactures from './pages/patient/MesFactures';
import PatientActualites  from './pages/patient/Actualites';

import RecepDashboard   from './pages/receptionniste/Dashboard';
import RecepFileAttente from './pages/receptionniste/FileAttente';
import RecepUrgences    from './pages/receptionniste/Urgences';
import RecepFacturation from './pages/receptionniste/Facturation';
import RecepScannerQR   from './pages/receptionniste/ScannerQR';

import PharmaDashboard   from './pages/pharmacien/Dashboard';
import PharmaStock       from './pages/pharmacien/Stock';
import PharmaOrdonnances from './pages/pharmacien/Ordonnances';

// Pages d'impression (sans layout, accès public avec token)
import PrintOrdonnance from './pages/PrintOrdonnance';
import PrintFacture    from './pages/PrintFacture';

// Pages admin
import AdminDashboard    from './pages/admin/Dashboard';
import AdminAssurances   from './pages/admin/Assurances';
import AdminInteractions from './pages/admin/Interactions';

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      background: 'var(--surface2)',
    }}>
      <span style={{ fontSize: '2.5rem' }}>🌿</span>
      <Spinner size={36} />
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Chargement…</p>
    </div>
  );
}

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }) {
  return (
    <>
      <Sidebar />
      <div className="layout-main fade-in">
        <Header />
        <main style={{ paddingBottom: '5rem', minHeight: 'calc(100vh - 72px)' }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Médecin */}
          <Route path="/medecin/dashboard"
            element={<PrivateRoute roles={['medecin']}><Layout><MedecinDashboard /></Layout></PrivateRoute>} />
          <Route path="/medecin/rdv"
            element={<PrivateRoute roles={['medecin']}><Layout><MedecinMesRdv /></Layout></PrivateRoute>} />
          <Route path="/medecin/patient/:id"
            element={<PrivateRoute roles={['medecin']}><Layout><MedecinFichePatient /></Layout></PrivateRoute>} />
          <Route path="/medecin/consultation/new"
            element={<PrivateRoute roles={['medecin']}><Layout><MedecinNouvelleConsult /></Layout></PrivateRoute>} />
          <Route path="/medecin/ordonnance/new"
            element={<PrivateRoute roles={['medecin']}><Layout><MedecinNouvelleOrdo /></Layout></PrivateRoute>} />

          {/* Patient */}
          <Route path="/patient/dashboard"
            element={<PrivateRoute roles={['patient']}><Layout><PatientDashboard /></Layout></PrivateRoute>} />
          <Route path="/patient/rdv"
            element={<PrivateRoute roles={['patient']}><Layout><PatientMesRdv /></Layout></PrivateRoute>} />
          <Route path="/patient/dossier"
            element={<PrivateRoute roles={['patient']}><Layout><PatientMonDossier /></Layout></PrivateRoute>} />
          <Route path="/patient/factures"
            element={<PrivateRoute roles={['patient']}><Layout><PatientMesFactures /></Layout></PrivateRoute>} />
          <Route path="/patient/actualites"
            element={<PrivateRoute roles={['patient']}><Layout><PatientActualites /></Layout></PrivateRoute>} />

          {/* Réceptionniste */}
          <Route path="/receptionniste/dashboard"
            element={<PrivateRoute roles={['receptionniste']}><Layout><RecepDashboard /></Layout></PrivateRoute>} />
          <Route path="/receptionniste/file-attente"
            element={<PrivateRoute roles={['receptionniste']}><Layout><RecepFileAttente /></Layout></PrivateRoute>} />
          <Route path="/receptionniste/urgences"
            element={<PrivateRoute roles={['receptionniste']}><Layout><RecepUrgences /></Layout></PrivateRoute>} />
          <Route path="/receptionniste/facturation"
            element={<PrivateRoute roles={['receptionniste']}><Layout><RecepFacturation /></Layout></PrivateRoute>} />
          <Route path="/receptionniste/scanner"
            element={<PrivateRoute roles={['receptionniste']}><Layout><RecepScannerQR /></Layout></PrivateRoute>} />

          {/* Pharmacien */}
          <Route path="/pharmacien/dashboard"
            element={<PrivateRoute roles={['pharmacien']}><Layout><PharmaDashboard /></Layout></PrivateRoute>} />
          <Route path="/pharmacien/stock"
            element={<PrivateRoute roles={['pharmacien']}><Layout><PharmaStock /></Layout></PrivateRoute>} />
          <Route path="/pharmacien/ordonnances"
            element={<PrivateRoute roles={['pharmacien']}><Layout><PharmaOrdonnances /></Layout></PrivateRoute>} />

          {/* Médecin — Téléconsultation, Urgences, Factures */}
          <Route path="/medecin/teleconsultation"
            element={<PrivateRoute roles={['medecin']}><Layout><MedecinTeleconsultation /></Layout></PrivateRoute>} />
          <Route path="/medecin/urgences"
            element={<PrivateRoute roles={['medecin']}><Layout><MedecinUrgences /></Layout></PrivateRoute>} />
          <Route path="/medecin/factures"
            element={<PrivateRoute roles={['medecin']}><Layout><MedecinFactures /></Layout></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard"
            element={<PrivateRoute roles={['admin']}><Layout><AdminDashboard /></Layout></PrivateRoute>} />
          <Route path="/admin/assurances"
            element={<PrivateRoute roles={['admin']}><Layout><AdminAssurances /></Layout></PrivateRoute>} />
          <Route path="/admin/interactions"
            element={<PrivateRoute roles={['admin']}><Layout><AdminInteractions /></Layout></PrivateRoute>} />

          {/* Profil commun à tous les rôles authentifiés */}
          <Route path="/profil"
            element={<PrivateRoute><Layout><Profil /></Layout></PrivateRoute>} />

          {/* Pages d'impression sans layout */}
          <Route path="/print/ordonnance/:id" element={<PrintOrdonnance />} />
          <Route path="/print/facture/:id"    element={<PrintFacture />} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
