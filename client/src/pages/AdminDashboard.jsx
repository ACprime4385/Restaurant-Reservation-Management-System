import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function AdminDashboard() {
  const { apiClient } = useAuth()
  const { addToast } = useToast()

  const [reservations, setReservations] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('')
  const [showTableForm, setShowTableForm] = useState(false)
  const [updatingResId, setUpdatingResId] = useState(null)
  const [creatingTable, setCreatingTable] = useState(false)
  const [tableFormData, setTableFormData] = useState({ tableNumber: '', capacity: '' })

  useEffect(() => {
    fetchData()
  }, [filterDate])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resResponse, tablesResponse] = await Promise.all([
        apiClient.get('/reservations', {
          params: filterDate ? { date: filterDate } : {},
        }),
        apiClient.get('/tables'),
      ])
      setReservations(resResponse.data.data || [])
      setTables(tablesResponse.data.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      addToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReservation = async (id, newStatus) => {
    try {
      setUpdatingResId(id)
      await apiClient.put(`/reservations/${id}`, { status: newStatus })
      addToast('Reservation updated successfully', 'success')
      fetchData()
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update reservation'
      addToast(message, 'error')
    } finally {
      setUpdatingResId(null)
    }
  }

  const handleCreateTable = async (e) => {
    e.preventDefault()
    if (!tableFormData.tableNumber || !tableFormData.capacity) {
      addToast('Please fill in all fields', 'error')
      return
    }
    try {
      setCreatingTable(true)
      await apiClient.post('/tables', {
        tableNumber: parseInt(tableFormData.tableNumber),
        capacity: parseInt(tableFormData.capacity),
      })
      addToast('Table created successfully', 'success')
      setTableFormData({ tableNumber: '', capacity: '' })
      setShowTableForm(false)
      fetchData()
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create table'
      addToast(message, 'error')
    } finally {
      setCreatingTable(false)
    }
  }

  const handleDeleteTable = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return
    try {
      await apiClient.delete(`/tables/${id}`)
      addToast('Table deleted successfully', 'success')
      fetchData()
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete table'
      addToast(message, 'error')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${styles[status] || 'bg-gray-50 text-gray-700'}`}>
        {status}
      </span>
    )
  }

  const reservationDetail = (reservation) => {
    const customer = reservation.customer || {}
    const tableInfo = reservation.table || {}

    return (
      <div key={reservation._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">
              {customer.name || 'Unknown'} — Table {tableInfo.tableNumber || 'N/A'}
            </h3>
            <p className="text-sm text-gray-500">{customer.email || ''}</p>
          </div>
          {getStatusBadge(reservation.status)}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium">{formatDate(reservation.date)}</p>
          </div>
          <div>
            <p className="text-gray-500">Time</p>
            <p className="font-medium">{reservation.timeSlot}</p>
          </div>
          <div>
            <p className="text-gray-500">Guests</p>
            <p className="font-medium">{reservation.numberOfGuests}</p>
          </div>
          <div>
            <p className="text-gray-500">Capacity</p>
            <p className="font-medium">{tableInfo.capacity || 'N/A'}</p>
          </div>
        </div>

        {reservation.status === 'confirmed' && (
          <button
            onClick={() => handleUpdateReservation(reservation._id, 'cancelled')}
            disabled={updatingResId === reservation._id}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {updatingResId === reservation._id ? 'Updating...' : 'Cancel Reservation'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">Manage all reservations and restaurant tables</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* === Reservations Column === */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Reservations</h2>
            <label className="block text-sm font-medium text-gray-600 mb-1">Filter by date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Reservations List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : reservations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No reservations found</p>
            ) : (
              <div className="space-y-4 max-h-[36rem] overflow-y-auto pr-1">
                {reservations.map(reservationDetail)}
              </div>
            )}
          </div>
        </div>

        {/* === Tables Column === */}
        <div className="space-y-6">
          {/* Add Table Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Table</h2>

            {!showTableForm ? (
              <button
                onClick={() => setShowTableForm(true)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                + New Table
              </button>
            ) : (
              <form onSubmit={handleCreateTable} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
                  <input
                    type="number"
                    value={tableFormData.tableNumber}
                    onChange={(e) => setTableFormData({ ...tableFormData, tableNumber: e.target.value })}
                    min="1" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={tableFormData.capacity}
                    onChange={(e) => setTableFormData({ ...tableFormData, capacity: e.target.value })}
                    min="1" max="20" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={creatingTable}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 transition">
                    {creatingTable ? 'Creating...' : 'Create'}
                  </button>
                  <button type="button" onClick={() => { setShowTableForm(false); setTableFormData({ tableNumber: '', capacity: '' }) }}
                    className="flex-1 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white font-medium rounded-lg transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Tables List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tables</h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : tables.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No tables yet</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {tables.map((table) => (
                  <div key={table._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                    <div>
                      <p className="font-semibold text-gray-900">Table {table.tableNumber}</p>
                      <p className="text-sm text-gray-500">Capacity: {table.capacity} guests</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTable(table._id)}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
