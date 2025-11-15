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
      required: [false, 'Please provide content.'],
    },
    liveContent: {
      type: String, // For simple "live point" text/HTML
      trim: true,
    },
    isFullArticle: {
      type: Boolean,
      default: false, // Will not show on homepage grid by default
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
    // --- ADD THIS FIELD ---
    featuredVideo: {
      type: String,
      default: '',
    },
    // --- END ---
    tags: [{ 
      type: String, 
      trim: true 
    }],
    publishedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Article ||
  mongoose.model('Article', ArticleSchema);