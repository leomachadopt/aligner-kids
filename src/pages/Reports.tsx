import PatientReports from './reports/PatientReports'
import ClinicianReports from './reports/ClinicianReports'
import { useUserRole } from '@/context/UserRoleContext'

const Reports = () => {
  const { role } = useUserRole()

  switch (role) {
    case 'patient':
    case 'child-patient':
      return <PatientReports />
    case 'orthodontist':
      return <ClinicianReports />
    default:
      return <PatientReports />
  }
}

export default Reports
