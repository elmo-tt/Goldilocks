import { useNavigate, useLocation } from 'react-router-dom'

const AUTH_KEY = 'gl_auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation() as any

  const signIn = () => {
    try {
      localStorage.setItem(AUTH_KEY, '1')
    } catch {}
    const dest = location?.state?.from?.pathname || '/admin'
    navigate(dest, { replace: true })
  }

  return (
    <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: 360, maxWidth: '90vw', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: 16 }}>
        <h2 style={{ margin: '0 0 8px' }}>Sign in</h2>
        <p style={{ margin: '0 0 14px', color: '#555' }}>Dev login only. Click to continue.</p>
        <button onClick={signIn} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #1b3d84', background: '#12306a', color: '#dfe8ff', cursor: 'pointer' }}>
          Sign in (dev)
        </button>
      </div>
    </div>
  )
}
