// This component will act as a router for different dashboards based on user role.
// For now, we'll just render the PatientDashboard as a default.
// In a real app, you'd have logic here to determine the user's role.

import PatientDashboard from './dashboard/PatientDashboard'
// import GuardianDashboard from './dashboard/GuardianDashboard';
// import ClinicianDashboard from './dashboard/ClinicianDashboard';

const Dashboard = () => {
  const userRole = 'patient' // This would come from an auth context

  switch (userRole) {
    case 'patient':
      return <PatientDashboard />
    // case 'guardian':
    //   return <GuardianDashboard />;
    // case 'orthodontist':
    //   return <ClinicianDashboard />;
    default:
      return <PatientDashboard />
  }
}

export default Dashboard
