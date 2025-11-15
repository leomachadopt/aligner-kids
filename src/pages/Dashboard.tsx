import PatientDashboard from './dashboard/PatientDashboard'
import { useUserRole } from '@/context/UserRoleContext'
// import GuardianDashboard from './dashboard/GuardianDashboard';
// import ClinicianDashboard from './dashboard/ClinicianDashboard';

const Dashboard = () => {
  const { role } = useUserRole()

  switch (role) {
    case 'patient':
    case 'child-patient':
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
