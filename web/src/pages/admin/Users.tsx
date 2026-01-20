import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { useLanguageStore } from '../../store/languageStore'
import type { User } from '../../types'

// Mock users data - replace with actual API
const mockUsers: User[] = [
  {
    id: 'user-1',
    phone: '+919876543210',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    role: 'buyer',
    preferences: null,
    language: 'en',
    blocked: false,
    created_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 'user-2',
    phone: '+919876543211',
    name: 'Priya Jain',
    email: 'priya@example.com',
    role: 'provider',
    preferences: null,
    language: 'hi',
    blocked: false,
    created_at: '2025-12-05T10:00:00Z',
  },
  {
    id: 'user-3',
    phone: '+919876543212',
    name: 'Amit Kumar',
    email: 'amit@example.com',
    role: 'buyer',
    preferences: null,
    language: 'en',
    blocked: true,
    blocked_reason: 'Spam reports',
    created_at: '2025-11-15T10:00:00Z',
  },
]

function UserRow({
  user,
  onBlock,
  onUnblock,
}: {
  user: User
  onBlock: (userId: string, reason: string) => void
  onUnblock: (userId: string) => void
}) {
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockReason, setBlockReason] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`border-b ${user.blocked ? 'bg-red-50' : ''}`}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.name || 'No name'}</p>
              <p className="text-sm text-gray-500">{user.id.slice(0, 8)}...</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2 text-gray-600">
            <PhoneIcon className="w-4 h-4" />
            {user.phone}
          </div>
        </td>
        <td className="px-6 py-4">
          {user.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <EnvelopeIcon className="w-4 h-4" />
              {user.email}
            </div>
          )}
        </td>
        <td className="px-6 py-4">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              user.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : user.role === 'provider'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {user.role}
          </span>
        </td>
        <td className="px-6 py-4">
          {user.blocked ? (
            <div className="flex items-center gap-1 text-red-600">
              <XCircleIcon className="w-4 h-4" />
              <span className="text-sm">Blocked</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </div>
          )}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
        <td className="px-6 py-4">
          {user.blocked ? (
            <button
              onClick={() => onUnblock(user.id)}
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              Unblock
            </button>
          ) : (
            <button
              onClick={() => setShowBlockModal(true)}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Block
            </button>
          )}
        </td>
      </motion.tr>

      {/* Block Modal */}
      {showBlockModal && (
        <tr>
          <td colSpan={7}>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Block User</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to block <strong>{user.name || user.phone}</strong>?
                </p>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Reason for blocking (required)"
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowBlockModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (blockReason.trim()) {
                        onBlock(user.id, blockReason)
                        setShowBlockModal(false)
                        setBlockReason('')
                      } else {
                        toast.error('Please provide a reason for blocking')
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Block User
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // In production, fetch from API
  const users = mockUsers

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.phone.includes(search) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleBlock = (userId: string, reason: string) => {
    // In production, call API
    toast.success('User blocked successfully')
    console.log('Blocking user', userId, 'for', reason)
  }

  const handleUnblock = (userId: string) => {
    // In production, call API
    toast.success('User unblocked successfully')
    console.log('Unblocking user', userId)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600 mt-2">View and manage all platform users</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyers</option>
              <option value="provider">Providers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onBlock={handleBlock}
                  onUnblock={handleUnblock}
                />
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No users found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
