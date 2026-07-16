import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reservation must belong to a customer'],
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'Please select a table'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide a reservation date'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Please provide a time slot'],
      enum: ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
    },
    numberOfGuests: {
      type: Number,
      required: [true, 'Please provide number of guests'],
      min: [1, 'At least 1 guest required'],
      max: [20, 'Maximum 20 guests per reservation'],
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  { timestamps: true }
);

reservationSchema.index({ table: 1, date: 1, timeSlot: 1, status: 1 }, { unique: true, sparse: true, partialFilterExpression: { status: 'confirmed' } });

reservationSchema.pre(/^find/, function() {
  this.populate({ path: 'customer', select: 'name email' })
    .populate({ path: 'table', select: 'tableNumber capacity' });
});

export default mongoose.model('Reservation', reservationSchema);
