import mongoose from 'mongoose';

const HeritageSiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide monument name.'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters.'],
    },
    slug: {
      type: String,
      required: [true, 'Please provide a unique slug.'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (lowercase letters, numbers, and hyphens).'],
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed site description.'],
      trim: true,
    },
    historicalBackground: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      required: [true, 'Please specify the Indian State/UT.'],
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: [true, 'Please specify city or district.'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90.'],
      max: [90, 'Latitude must be between -90 and 90.'],
      default: 0,
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180.'],
      max: [180, 'Longitude must be between -180 and 180.'],
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Please specify a category.'],
      trim: true,
      index: true,
    },
    openingHours: {
      open: { type: String, default: '06:00' },
      close: { type: String, default: '18:00' },
    },
    weeklyClosingDay: {
      type: String,
      default: 'None',
    },
    entryFee: {
      indianAdult: { type: Number, default: 50, min: 0 },
      saarcBimstec: { type: Number, default: 540, min: 0 },
      foreignerAdult: { type: Number, default: 1100, min: 0 },
      child: { type: Number, default: 0, min: 0 },
      mausoleumSupplement: { type: Number, default: 0, min: 0 },
    },
    visitorInstructions: {
      type: [String],
      default: [],
    },
    websiteUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    demonstrationCapacity: {
      maxPerHour: { type: Number, default: 1000, min: 1 },
      standardSlotCapacity: { type: Number, default: 200, min: 1 },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of existing model in Next.js hot-reload
export default mongoose.models.HeritageSite ||
  mongoose.model('HeritageSite', HeritageSiteSchema);
