import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminSession()
  }, [])

  async function checkAdminSession() {
    try {
      const session = sessionStorage.getItem('lazar_admin')
      if (session) {
        const adminData = JSON.parse(session)
        setAdmin(adminData)
      }
    } catch (error) {
      console.error('Session check error:', error)
      sessionStorage.removeItem('lazar_admin')
    } finally {
      setLoading(false)
    }
  }

  async function login(username, password) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: 'login', username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      setAdmin(data.admin)
      sessionStorage.setItem('lazar_admin', JSON.stringify(data.admin))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function logout() {
    setAdmin(null)
    sessionStorage.removeItem('lazar_admin')
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}

// Customer Auth Context
const CustomerAuthContext = createContext(null)

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Fetch user profile from our users table
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single()

        setUser({
          id: session.user.id,
          email: session.user.email,
          ...userProfile
        })
      }
    } catch (error) {
      console.error('Session error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single()

          setUser({
            id: session.user.id,
            email: session.user.email,
            ...userProfile
          })
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email, password, name, phone) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Create user profile
        await supabase.from('users').insert({
          id: data.user.id,
          email,
          name,
          phone,
          password_hash: '', // Supabase handles auth
        })

        setUser({
          id: data.user.id,
          email,
          name,
          phone
        })
      }

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.user.email)
          .single()

        setUser({
          id: data.user.id,
          email: data.user.email,
          ...userProfile
        })
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  async function updateProfile(updates) {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      setUser({ ...user, ...updates })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return (
    <CustomerAuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile
    }}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider')
  }
  return context
}
