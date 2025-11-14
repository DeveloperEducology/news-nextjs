import mongoose from 'mongoose';

const PhotoSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, 'Please provide the image URL.'],
    },
    caption: {
      type: String,
      required: [true, 'Please provide a caption.'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

export default mongoose.models.Photo || mongoose.model('Photo', PhotoSchema);