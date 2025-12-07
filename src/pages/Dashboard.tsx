import PatientDashboard from './dashboard/PatientDashboard'
import ClinicianDashboard from './dashboard/ClinicianDashboard'
import { useUserRole } from '@/context/UserRoleContext'
// import GuardianDashboard from './dashboard/GuardianDashboard';

const Dashboard = () => {
  const { role } = useUserRole()

  switch (role) {
    case 'patient':
    case 'child-patient':
      return <PatientDashboard />
    case 'orthodontist':
      return <ClinicianDashboard />
    // case 'guardian':
    //   return <GuardianDashboard />;
    default:
      return <PatientDashboard />
  }
}

export default Dashboard
