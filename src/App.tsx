import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { LoginPage } from '@/auth/LoginPage'
import { RequireAuth } from '@/auth/RequireAuth'
import { homePathFor } from '@/auth/navigation'
import { AppLayout } from '@/components/AppLayout'
import { CaseDetailPage } from '@/features/exception-detail/CaseDetailPage'
import { ComingSoonPage } from '@/features/placeholder/ComingSoonPage'
import { QueuePage } from '@/features/queue/QueuePage'

/** Bilinmeyen adresler: girişliyse kendi ana sayfasına, değilse login'e. */
function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route element={<RequireAuth roles={['Specialist', 'TeamLead']} />}>
              <Route path="/queue" element={<QueuePage />} />
              <Route path="/cases/:id" element={<CaseDetailPage />} />
              <Route path="/knowledge-base" element={<ComingSoonPage title="Bilgi Tabanı" phase="Faz 4" />} />
            </Route>
            <Route element={<RequireAuth roles={['TeamLead']} />}>
              <Route path="/approvals" element={<ComingSoonPage title="Onay Bekleyen Çözümler" phase="Faz 3" />} />
            </Route>
            <Route element={<RequireAuth roles={['TeamLead', 'Manager']} />}>
              <Route path="/dashboard" element={<ComingSoonPage title="Operasyon Dashboard" phase="Faz 5" />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
