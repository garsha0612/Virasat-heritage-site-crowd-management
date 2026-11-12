import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long.'],
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address.',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a secure password.'],
      minlength: [8, 'Password must be at least 8 characters long.'],
      select: false, // Omit from default queries to protect credential hashes
    },
    role: {
      type: String,
      enum: {
        values: ['visitor', 'admin', 'staff'],
        message: '{VALUE} is not a recognized system role.',
      },
      default: 'visitor',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    nationality: {
      type: String,
      trim: true,
      default: 'Indian',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Instance method to compare candidate password against stored bcrypt hash.
 *
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error('Password hash not selected in query.');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Static method to format a user document into a safe user payload
 * without sensitive hash or internal Mongoose fields.
 *
 * @param {Object} userDoc
 * @returns {Object}
 */
UserSchema.statics.toSafeUser = function (userDoc) {
  if (!userDoc) return null;
  const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete obj.password;
  delete obj.__v;

  return {
    id: obj._id ? obj._id.toString() : obj.id,
    name: obj.name,
    email: obj.email,
    role: obj.role,
    phone: obj.phone || '',
    nationality: obj.nationality || 'Indian',
    isActive: obj.isActive ?? true,
    lastLogin: obj.lastLogin,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

// Prevent Mongoose model recompilation during Next.js hot-reloading
export default mongoose.models.User || mongoose.model('User', UserSchema);
