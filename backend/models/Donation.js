const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  foodName: {
    type: String,
    required: [true, 'Please add a food title/name'],
    trim: true,
  },
  quantity: {
    type: String,
    required: [true, 'Please specify quantity (e.g., 5 kg, 12 meals)'],
  },
  weightKg: {
    type: Number,
    required: [true, 'Please estimate weight in kg for impact calculations'],
    default: 0,
  },
  foodType: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Vegan'],
    default: 'Veg',
  },
  expiryTime: {
    type: Date,
    required: [true, 'Please set an expiry date and time'],
  },
  status: {
    type: String,
    enum: ['available', 'requested', 'accepted', 'completed', 'cancelled'],
    default: 'available',
  },
  address: {
    type: String,
    required: [true, 'Please add a pickup address'],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  peopleHelped: {
    type: Number,
    default: 0,
  },
  claimedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  chatMessages: [
    {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      text: {
        type: String,
        required: true,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

DonationSchema.index({ location: '2dsphere' });

DonationSchema.virtual('latitude').get(function() {
  return this.location?.coordinates?.[1];
});
DonationSchema.virtual('longitude').get(function() {
  return this.location?.coordinates?.[0];
});

DonationSchema.set('toJSON', { virtuals: true });
DonationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Donation', DonationSchema);
