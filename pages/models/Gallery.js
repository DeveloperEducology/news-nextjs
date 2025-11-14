import mongoose from 'mongoose';

// Sub-schema for individual images inside a gallery
const ImageSubSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  caption: { type: String, trim: true }, // Optional caption per image
});

const GallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a gallery title.'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Please provide a slug.'],
      unique: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true, // Short description for SEO and the main list
    },
    featuredImage: {
      type: String,
      required: [true, 'Please provide a featured cover image.'],
    },
    images: [ImageSubSchema], // Array of images
     content: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
    publishedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Gallery || mongoose.model('Gallery', GallerySchema);