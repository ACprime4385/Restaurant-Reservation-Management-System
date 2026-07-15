import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: [true, 'Please provide a table number'],
      unique: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide table capacity'],
      min: [1, 'Capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: ['available', 'maintenance'],
      default: 'available',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Table', tableSchema);
