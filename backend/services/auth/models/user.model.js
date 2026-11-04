import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  avatar:{
    type: String,
    required: false,
  },
  timestamps: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

export default User;