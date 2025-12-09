import PatientDashboard from './dashboard/PatientDashboard'
import ClinicianDashboard from './dashboard/ClinicianDashboard'
import SuperAdminDashboard from './dashboard/SuperAdminDashboard'
import { useUserRole } from '@/context/UserRoleContext'

const Dashboard = () => {
  const { role } = useUserRole()

  switch (role) {
    case 'patient':
    case 'child-patient':
      return <PatientDashboard />
    case 'orthodontist':
      return <ClinicianDashboard />
    case 'super-admin':
      return <SuperAdminDashboard />
    default:
      return <PatientDashboard />
  }
}

export default Dashboard
