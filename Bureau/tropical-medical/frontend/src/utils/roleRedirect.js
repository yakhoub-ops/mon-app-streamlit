export const getDashboardByRole = (role) => {
  const routes = {
    medecin:        '/medecin/dashboard',
    patient:        '/patient/dashboard',
    receptionniste: '/receptionniste/dashboard',
    pharmacien:     '/pharmacien/dashboard',
    admin:          '/admin/assurances',
  };
  return routes[role] || '/login';
};
