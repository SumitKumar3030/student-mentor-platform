import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'

const schema = z.object({
  email: z.string().email('Invalid email'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setSent(true)
    toast.success('Reset link sent to your email')
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We sent a password reset link to your inbox`}
        footer={
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">
            ← Back to sign in
          </Link>
        }
      >
        <div className="text-center py-4">
          <div className="text-5xl mb-4">📬</div>
          <p className="text-neutral-400 text-sm">
            Didn't receive it? Check spam, or try again in a minute.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            className="w-full px-3 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors placeholder:text-neutral-500"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  )
}