import { LoginForm } from '@/components/login-form'
import React from 'react'
import { useSearchParams } from 'react-router-dom'

const LoginPage = () => {
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error') || ''

  return (
    <div className='min-h-svh flex items-center justify-center'>
      <LoginForm initialError={error} />
    </div>
  )
}

export default LoginPage
