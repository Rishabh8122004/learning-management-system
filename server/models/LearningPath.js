const mongoose = require('mongoose');

const isInteger = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer',
};

// No `completed` here: official completion comes from Enrollment.
const pathCourseSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  order: { type: Number, required: true, min: 1, validate: isInteger },
});

const customItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 1, maxlength: 150 },
  description: { type: String, default: '', trim: true, maxlength: 500 },
  order: { type: Number, required: true, min: 1, validate: isInteger },
  completed: { type: Boolean, default: false },
});

const learningPathSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 150 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    courses: { type: [pathCourseSchema], default: [] },
    customItems: { type: [customItemSchema], default: [] },
  },
  { timestamps: true, collection: 'learningPaths' }
);

learningPathSchema.index({ user: 1 });

module.exports = mongoose.model('LearningPath', learningPathSchema);