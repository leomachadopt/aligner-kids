/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { UserRoleProvider } from '@/context/UserRoleContext'
import { GamificationProvider } from '@/context/GamificationContext'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import MyTreatment from './pages/MyTreatment'
import Photos from './pages/Photos'
import Chat from './pages/Chat'
import Education from './pages/Education'
import Gamification from './pages/Gamification'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Help from './pages/Help'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import PatientManagement from './pages/PatientManagement'
import PatientDetail from './pages/PatientDetail'
import AlignerManagement from './pages/AlignerManagement'
import StoryDirector from './pages/StoryDirector'
import StoryReader from './pages/StoryReader'
import AdminPrompts from './pages/AdminPrompts'
import AdminClinics from './pages/AdminClinics'
import AdminOrthodontists from './pages/AdminOrthodontists'
import AdminMissions from './pages/AdminMissions'
import AdminDataManagement from './pages/AdminDataManagement'
import MissionConfig from './pages/MissionConfig'
import MyStory from './pages/MyStory'
import { ProtectedRoute } from './components/ProtectedRoute'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <AuthProvider>
      <UserRoleProvider>
        <GamificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Rotas Protegidas (Requer Autenticação) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-treatment" element={<MyTreatment />} />
                <Route path="/photos" element={<Photos />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/education" element={<Education />} />
                <Route path="/gamification" element={<Gamification />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
                <Route path="/story-director" element={<StoryDirector />} />
                <Route path="/story-reader/:storyId" element={<StoryReader />} />
                <Route path="/my-story" element={<MyStory />} />
              </Route>
            </Route>

            {/* Rotas Apenas para Ortodontistas e Super-Admin */}
            <Route element={<ProtectedRoute allowedRoles={['orthodontist', 'super-admin']} />}>
              <Route element={<Layout />}>
                <Route path="/patient-management" element={<PatientManagement />} />
                <Route path="/patient/:id" element={<PatientDetail />} />
                <Route path="/aligner-management" element={<AlignerManagement />} />
                <Route path="/mission-config" element={<MissionConfig />} />
              </Route>
            </Route>

            {/* Rotas Apenas para Super-Admin */}
            <Route element={<ProtectedRoute allowedRoles={['super-admin']} />}>
              <Route element={<Layout />}>
                <Route path="/admin/clinics" element={<AdminClinics />} />
                <Route path="/admin/orthodontists" element={<AdminOrthodontists />} />
                <Route path="/admin/prompts" element={<AdminPrompts />} />
                <Route path="/admin/missions" element={<AdminMissions />} />
                <Route path="/admin/data" element={<AdminDataManagement />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </GamificationProvider>
    </UserRoleProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
