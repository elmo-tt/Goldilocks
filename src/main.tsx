import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ScrollToTop from '@/components/ScrollToTop'
import './styles/tokens.css'
import './styles/global.css'
import './i18n'
import App from './App.tsx'
import ProtectedRoute from './routes/ProtectedRoute'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const TeamPage = lazy(() => import('./pages/TeamPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const MotorAccidents = lazy(() => import('@/pages/practice/MotorAccidents'))
const PracticeAreaPage = lazy(() => import('@/pages/practice/PracticeAreaPage'))
const Login = lazy(() => import('./pages/Login'))
const ArticlesList = lazy(() => import('./pages/articles/ArticlesList'))
const ArticlePage = lazy(() => import('./pages/articles/ArticlePage'))
const ArticleTemplatePreview = lazy(() => import('./pages/templates/ArticleTemplatePreview'))
const PracticeAreaTemplatePreview = lazy(() => import('./pages/templates/PracticeAreaTemplatePreview'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/practice/motor-accidents" element={<MotorAccidents />} />
          <Route path="/practice/:key" element={<PracticeAreaPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/articles" element={<ArticlesList />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="/templates/article-preview" element={<ArticleTemplatePreview />} />
          <Route path="/templates/practice-preview" element={<PracticeAreaTemplatePreview />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminApp />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
