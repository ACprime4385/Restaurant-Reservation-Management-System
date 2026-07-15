import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import BookingForm from '../components/BookingForm'

function CustomerDashboard() {
  const { apiClient, user } = useAuth()
  const { addToast } = useToast()

  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)
  const [showBookingForm, setShowBookingForm] = useState(false)

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/reservations/my')
      setReservations(response.data.data || [])
    } catch (error) {
      console.error('Error fetching reservations:', error)
      addToast('Failed to load reservations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return
    }

    try {
      setCancelling(id)
      await apiClient.delete(`/reservations/${id}`)
      addToast('Reservation cancelled successfully', 'success')
      // Optimistically remove from list, re-fetch to be safe
      fetchReservations()
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to cancel reservation'
      addToast(message, 'error')
    } finally {
      setCancelling(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const reservationCard = (reservation) => {
    const tableInfo = reservation.table || {}
    const statusColors = {
      confirmed: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    }
    const colorClass = statusColors[reservation.status] || 'bg-gray-50 text-gray-700 border-gray-200'

    return (
      <div
        key={reservation._id}
        className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Table {tableInfo.tableNumber || 'N/A'}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
                {reservation.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{formatDate(reservation.date)}</p>
              </div>
              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-medium text-gray-900">{reservation.timeSlot}</p>
              </div>
              <div>
                <p className="text-gray-500">Guests</p>
                <p className="font-medium text-gray-900">{reservation.numberOfGuests}</p>
              </div>
              <div>
                <p className="text-gray-500">Capacity</p>
                <p className="font-medium text-gray-900">{tableInfo.capacity || 'N/A'}</p>
              </div>
            </div>
          </div>

          {reservation.status === 'confirmed' && (
            <button
              onClick={() => handleCancelReservation(reservation._id)}
              disabled={cancelling === reservation._id}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
            >
              {cancelling === reservation._id ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name || 'Guest'}!
        </h1>
        <p className="text-gray-500 mb-6">Manage your reservations and book new tables</p>

        {!showBookingForm ? (
          <button
            onClick={() => setShowBookingForm(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            + New Reservation
          </button>
        ) : (
          <button
            onClick={() => setShowBookingForm(false)}
            className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
          >
            ← Back to Reservations
          </button>
        )}
      </div>

      {/* Booking Form */}
      {showBookingForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Make a New Reservation</h2>
          <BookingForm
            onSuccess={() => {
              setShowBookingForm(false)
              fetchReservations()
            }}
          />
        </div>
      )}

      {/* Reservations List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Reservations</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No reservations yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map(reservationCard)}
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerDashboard
