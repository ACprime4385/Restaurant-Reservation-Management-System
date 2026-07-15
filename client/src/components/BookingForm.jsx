import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function BookingForm({ onSuccess }) {
  const { apiClient } = useAuth()
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    date: '',
    timeSlot: '',
    numberOfGuests: 1,
    tableId: '',
  })

  const [availableTables, setAvailableTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const timeSlots = [
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
  ]

  const minDate = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (formData.date && formData.timeSlot && formData.numberOfGuests) {
      searchAvailableTables()
    }
  }, [formData.date, formData.timeSlot, formData.numberOfGuests])

  const searchAvailableTables = async () => {
    try {
      setSearching(true)
      const response = await apiClient.get('/reservations/available', {
        params: {
          date: formData.date,
          timeSlot: formData.timeSlot,
          numberOfGuests: formData.numberOfGuests,
        },
      })
      setAvailableTables(response.data.data || [])
      setFormData((prev) => ({ ...prev, tableId: '' }))
    } catch (error) {
      console.error('Error searching tables:', error)
      setAvailableTables([])
    } finally {
      setSearching(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'numberOfGuests' ? parseInt(value) : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.tableId) {
      addToast('Please select a table', 'error')
      return
    }

    try {
      setLoading(true)
      await apiClient.post('/reservations', {
        tableId: formData.tableId,
        date: formData.date,
        timeSlot: formData.timeSlot,
        numberOfGuests: formData.numberOfGuests,
      })

      addToast('Reservation created successfully!', 'success')
      setFormData({
        date: '',
        timeSlot: '',
        numberOfGuests: 1,
        tableId: '',
      })
      setAvailableTables([])

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create reservation'
      addToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            min={minDate}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Time Slot */}
        <div>
          <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-2">
            Time Slot
          </label>
          <select
            id="timeSlot"
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select a time slot</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        {/* Number of Guests */}
        <div>
          <label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Guests
          </label>
          <input
            type="number"
            id="numberOfGuests"
            name="numberOfGuests"
            value={formData.numberOfGuests}
            onChange={handleInputChange}
            min="1"
            max="20"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Available Tables */}
      {formData.date && formData.timeSlot && formData.numberOfGuests && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {searching ? 'Searching for available tables...' : 'Available Tables'}
          </label>

          {searching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : availableTables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTables.map((table) => (
                <div
                  key={table._id}
                  onClick={() => setFormData((prev) => ({ ...prev, tableId: table._id }))}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    formData.tableId === table._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Table {table.tableNumber}</p>
                      <p className="text-sm text-gray-600">Capacity: {table.capacity} guests</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        formData.tableId === table._id
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-gray-300'
                      }`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              No tables available for the selected date, time, and guest count.
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !formData.tableId}
        className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Creating Reservation...' : 'Book Table'}
      </button>
    </form>
  )
}

export default BookingForm
