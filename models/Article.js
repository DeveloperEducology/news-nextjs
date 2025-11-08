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
    summary: {
      type: String,
      required: [true, 'Please provide a summary.'],
    },
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
    featuredImage: {
      type: String, 
      default: '',
    },
    tags: [{ 
      type: String, 
      trim: true 
    }],
    
    // --- NEW FIELDS ---
    publishedDate: {
      type: Date,
      default: Date.now, // Defaults to 'now'
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
    // --- END NEW FIELDS ---
  },
  {
    timestamps: true, // This will automatically add createdAt and updatedAt
  }
);

export default mongoose.models.Article ||
  mongoose.model('Article', ArticleSchema);