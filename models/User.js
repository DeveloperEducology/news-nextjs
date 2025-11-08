import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
  },
  // --- ADD THIS ---
  password: {
    type: String,
    // We don't make this 'required' because
    // users signing in with Google won't have one.
  },
  // --- END ADD ---
  image: {
    type: String,
  },
  emailVerified: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);