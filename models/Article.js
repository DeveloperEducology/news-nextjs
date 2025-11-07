import mongoose from 'mongoose';

const ArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title.'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Please provide a slug.'],
      unique: true,
      trim: true,
    },
    // --- THIS IS THE UPDATE ---
    summary: { // Changed from 'excerpt'
      type: String,
      required: [true, 'Please provide a summary.'],
    },
    // --- END OF UPDATE ---
    content: {
      type: String,
      required: [true, 'Please provide content.'],
    },
    author: {
      type: String,
      default: 'Admin',
    },
    category: {
      type: String,
      default: 'General',
    },
    tags: [{ 
      type: String, 
      trim: true 
    }],
    featuredImage: { // Make sure this is in your model
      type: String, 
      default: '',
    },
  },
  {
    timestamps: true, // This will automatically add createdAt and updatedAt
  }
);

export default mongoose.models.Article ||
  mongoose.model('Article', ArticleSchema);