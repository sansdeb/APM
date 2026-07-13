
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login    from './pages/Login';
import Register from './pages/Register';
import RequesterDashboard from './pages/dashboards/RequestorDashboard';
import ApproverDashboard  from './pages/dashboards/ApproverDashboard';
import ApproverFormView   from './pages/dashboards/ApproverFormView';
import FATeamDashboard from './pages/dashboards/FATeamDashboard';
import FATeamFormView  from './pages/dashboards/FATeamFormView';
import TaxationDashboard from './pages/dashboards/TaxationDashboard';
import TaxationFormView  from './pages/dashboards/TaxationFormView';
import TaxInvoicePrint from './pages/TaxInvoicePrint';




// ─── RoleRoute ────────────────────────────────────────────────────────────────
// Checks BOTH that the user is logged in AND that their role matches.
// If wrong role → redirect to their correct dashboard
function RoleRoute({ allowedRole, children }) {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;

  if (role !== allowedRole) {
    // Send them to their own dashboard instead
    const redirectMap = {
      requester: '/dashboard/requester',
      approver:  '/dashboard/approver',
      fa_team:   '/dashboard/fa-team',
      taxation:  '/dashboard/taxation',
    };
    return <Navigate to={redirectMap[role] || '/login'} replace />;
  }

  return children;
}

// ─── Temporary placeholder dashboard ─────────────────────────────────────────




   
// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
    <Routes>
  <Route path="/" element={<Navigate to="/login" replace />} />  {/* ADD THIS */}
  <Route path="/login"    element={<Login />} />
  <Route path="/register" element={<Register />} />
  {/* ... rest of your routes unchanged */}
</Routes>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Role-specific dashboards */}
        {/* Each role sees only their own dashboard */}
        <Route
          path="/dashboard/requester"
          element={
            <RoleRoute allowedRole="requester">
              <RequesterDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/dashboard/approver"
          element={
            <RoleRoute allowedRole="approver">
              <ApproverDashboard />
            </RoleRoute>
          }
        />

        <Route path="/approver/request/:id" element={
          <RoleRoute allowedRole="approver">
            <ApproverFormView />
          </RoleRoute>
        } />

        <Route path="/dashboard/fa-team" element={
  <RoleRoute allowedRole="fa_team">
    <FATeamDashboard />
  </RoleRoute>
} />

<Route path="/fa/request/:id" element={
  <RoleRoute allowedRole="fa_team">
    <FATeamFormView />
  </RoleRoute>
} />

       <Route path="/dashboard/taxation" element={
          <RoleRoute allowedRole="taxation">
            <TaxationDashboard />
          </RoleRoute>
        } />

        <Route path="/taxation/request/:id" element={
          <RoleRoute allowedRole="taxation">
            <TaxationFormView />
          </RoleRoute>
        } />

        
<Route path="/taxation/invoice/:id" element={
  <RoleRoute allowedRole="taxation">
    <TaxInvoicePrint />
  </RoleRoute>
} />
</Routes>
    </BrowserRouter>
  );
}