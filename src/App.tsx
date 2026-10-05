import { Suspense, lazy } from 'react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/ui'
import { useSessionStore } from '@/store/sessionStore'

// Экраны загружаются лениво: вход и чат попадают в отдельные чанки,
// что уменьшает размер стартового бандла.
const LoginScreen = lazy(() =>
  import('@/features/auth/LoginScreen').then((module) => ({ default: module.LoginScreen })),
)
const ChatLayout = lazy(() =>
  import('@/features/chat/ChatLayout').then((module) => ({ default: module.ChatLayout })),
)

function ScreenFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <span className="size-6 animate-spin rounded-full border-2 border-surface-3 border-t-accent" />
    </div>
  )
}

export default function App() {
  const credentials = useSessionStore((state) => state.credentials)

  return (
    <TooltipProvider delayDuration={300}>
      <Suspense fallback={<ScreenFallback />}>
        {credentials ? <ChatLayout /> : <LoginScreen />}
      </Suspense>
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </TooltipProvider>
  )
}
