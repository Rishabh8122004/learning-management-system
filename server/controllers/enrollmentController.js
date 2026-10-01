const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const isValidId = (id) => typeof id === 'string' && OBJECT_ID_REGEX.test(id);

const handleError = (res, err, label) => {
  if (err && (err.name === 'ValidationError' || err.name === 'CastError')) {
    return fail(res, 400, 'Invalid data');
  }
  console.error(`${label} error:`, err);
  return fail(res, 500, 'Server error');
};

// Populate config shared by all reads. published/deletedAt are only used to compute courseAvailable.
const COURSE_POPULATE = {
  path: 'course',
  select: 'title description category level thumbnail instructor published deletedAt',
  populate: { path: 'instructor', select: 'name' },
};

// Public shape of an enrollment (no user id, no __v, no raw published/deletedAt).
const toView = (e) => {
  const c = e.course && e.course._id ? e.course : null;
  return {
    _id: e._id,
    course: c
      ? {
          _id: c._id,
          title: c.title,
          description: c.description,
          category: c.category,
          level: c.level,
          thumbnail: c.thumbnail,
          instructor: c.instructor ? { _id: c.instructor._id, name: c.instructor.name } : null,
        }
      : e.course || null,
    courseAvailable: !!c && c.published === true && !c.deletedAt,
    status: e.status,
    progress: {
      percentage: e.progress.percentage,
      completedLessons: e.progress.completedLessons,
      lastAccessedLesson: e.progress.lastAccessedLesson,
    },
    enrolledAt: e.enrolledAt,
    completedAt: e.completedAt,
  };
};

const loadView = async (filter) => {
  const enrollment = await Enrollment.findOne(filter).populate(COURSE_POPULATE).lean();
  return enrollment ? toView(enrollment) : null;
};

// POST /api/enrollments/:courseId
const enroll = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!isValidId(courseId)) return fail(res, 400, 'Invalid course ID');

    // Only published, non-archived courses can be newly enrolled in.
    const course = await Course.findOne({ _id: courseId, published: true, deletedAt: null }).select('_id');
    if (!course) return fail(res, 404, 'Course not found');

    const existing = await Enrollment.exists({ user: req.user.id, course: courseId });
    if (existing) return fail(res, 409, 'Already enrolled in this course');

    // User always comes from the JWT, never from the body.
    const created = await Enrollment.create({ user: req.user.id, course: courseId });

    const view = await loadView({ _id: created._id });
    return res.status(201).json({ success: true, enrollment: view });
  } catch (err) {
    if (err && err.code === 11000) return fail(res, 409, 'Already enrolled in this course'); // race
    return handleError(res, err, 'Enroll');
  }
};

// GET /api/enrollments/me
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate(COURSE_POPULATE)
      .sort({ enrolledAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({ success: true, enrollments: enrollments.map(toView) });
  } catch (err) {
    return handleError(res, err, 'Get my enrollments');
  }
};

// GET /api/enrollments/:id
const getEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return fail(res, 400, 'Invalid enrollment ID');

    // Filtering by user means other users' enrollments look like "not found".
    const view = await loadView({ _id: id, user: req.user.id });
    if (!view) return fail(res, 404, 'Enrollment not found');

    return res.status(200).json({ success: true, enrollment: view });
  } catch (err) {
    return handleError(res, err, 'Get enrollment');
  }
};

// POST /api/enrollments/:id/lessons/:lessonId/complete
// Archived (soft-deleted) course => progress is frozen (409). Unpublished-but-not-archived
// courses still accept progress, since the user is already enrolled.
const completeLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    if (!isValidId(id)) return fail(res, 400, 'Invalid enrollment ID');
    if (!isValidId(lessonId)) return fail(res, 400, 'Invalid lesson ID');

    const enrollment = await Enrollment.findOne({ _id: id, user: req.user.id }).select('course');
    if (!enrollment) return fail(res, 404, 'Enrollment not found');

    const course = await Course.findById(enrollment.course).select('deletedAt modules.lessons._id');
    if (!course) return fail(res, 404, 'Course not found');
    if (course.deletedAt) {
      return fail(res, 409, 'This course has been archived; progress can no longer be updated');
    }

    // Every lesson ID currently in the course (across all modules).
    const courseLessonIds = new Set();
    course.modules.forEach((m) => m.lessons.forEach((l) => courseLessonIds.add(l._id.toString())));

    if (!courseLessonIds.has(lessonId)) {
      return fail(res, 404, 'Lesson not found in this course');
    }

    // Atomic add: $addToSet cannot create duplicates, even with concurrent requests.
    const updated = await Enrollment.findOneAndUpdate(
      { _id: id, user: req.user.id },
      {
        $addToSet: { 'progress.completedLessons': lessonId },
        $set: { 'progress.lastAccessedLesson': lessonId },
      },
      { returnDocument: 'after' }
    );

    // Count only lessons that still exist in the course (admin may have removed some).
    const total = courseLessonIds.size;
    const done = updated.progress.completedLessons.filter((l) => courseLessonIds.has(l.toString())).length;

    let percentage = 0;
    if (total > 0) {
      // 100 only when every lesson is done; never let rounding show 100 early.
      percentage = done >= total ? 100 : Math.min(99, Math.round((done / total) * 100));
    }
    const isComplete = total > 0 && done >= total;

    await Enrollment.updateOne(
      { _id: id, user: req.user.id },
      {
        $set: {
          'progress.percentage': percentage,
          status: isComplete ? 'completed' : 'active',
          // keep the original completion time if already completed
          completedAt: isComplete ? updated.completedAt || new Date() : null,
        },
      },
      { runValidators: true }
    );

    const view = await loadView({ _id: id, user: req.user.id });
    return res.status(200).json({ success: true, enrollment: view });
  } catch (err) {
    return handleError(res, err, 'Complete lesson');
  }
};

module.exports = { enroll, getMyEnrollments, getEnrollment, completeLesson };