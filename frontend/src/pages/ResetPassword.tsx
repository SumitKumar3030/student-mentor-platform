import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  })

type FormData = z.infer<typeof schema>

export default function ResetPassword() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Password updated! Please sign in.')
    navigate('/login')
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">New password</label>
          <input
            {...register('password')}
            type="password"
            placeholder="At least 8 characters"
            className="w-full px-3 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors placeholder:text-neutral-500"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Confirm password</label>
          <input
            {...register('confirm')}
            type="password"
            placeholder="Re-enter password"
            className="w-full px-3 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors placeholder:text-neutral-500"
          />
          {errors.confirm && (
            <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  )
}