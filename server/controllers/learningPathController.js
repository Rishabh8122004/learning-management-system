const LearningPath = require('../models/LearningPath');
const Course = require('../models/Course');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const isValidId = (id) => typeof id === 'string' && OBJECT_ID_REGEX.test(id);
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isPositiveInt = (v) => typeof v === 'number' && Number.isInteger(v) && v >= 1;

const handleError = (res, err, label) => {
  if (err && err.name === 'ValidationError') {
    return fail(res, 400, Object.values(err.errors).map((e) => e.message).join('; '));
  }
  if (err && err.name === 'CastError') return fail(res, 400, `Invalid value for ${err.path}`);
  if (err && err.name === 'VersionError') {
    return fail(res, 409, 'Learning path was changed by another request. Please retry.');
  }
  console.error(`${label} error:`, err);
  return fail(res, 500, 'Server error');
};

// ---------- request validation helpers (return an error message or null) ----------

const unknownKeys = (obj, allowed) => Object.keys(obj).filter((k) => !allowed.includes(k));

const checkStrings = (obj, fields) => {
  for (const f of fields) {
    if (obj[f] !== undefined && typeof obj[f] !== 'string') return `${f} must be a string`;
  }
  return null;
};

const checkBody = (body, allowed) => {
  if (!isPlainObject(body)) return 'Request body must be a JSON object';
  const extra = unknownKeys(body, allowed);
  if (extra.length) return `Unknown field(s): ${extra.join(', ')}`;
  return null;
};

// One custom item as sent by the client: { title, description?, order }
const checkCustomItem = (item) => {
  const bodyError = checkBody(item, ['title', 'description', 'order']);
  if (bodyError) return bodyError;
  if (item.title === undefined) return 'title is required';
  const stringError = checkStrings(item, ['title', 'description']);
  if (stringError) return stringError;
  if (!isPositiveInt(item.order)) return 'order must be a positive integer';
  return null; // lengths are enforced by the schema
};

// One official course entry as sent by the client: { course, order }
const checkCourseEntry = (entry) => {
  const bodyError = checkBody(entry, ['course', 'order']);
  if (bodyError) return bodyError;
  if (!isValidId(entry.course)) return 'course must be a valid course ID';
  if (!isPositiveInt(entry.order)) return 'order must be a positive integer';
  return null;
};

// Only published, non-archived courses can be referenced (same visibility as the public API).
const countAvailableCourses = (ids) =>
  Course.countDocuments({ _id: { $in: ids }, published: true, deletedAt: null });

// ---------- response shaping ----------

const COURSE_POPULATE = {
  path: 'courses.course',
  select: 'title description category level thumbnail instructor published deletedAt',
  populate: { path: 'instructor', select: 'name' },
};

const byOrder = (a, b) => a.order - b.order || String(a._id).localeCompare(String(b._id));

// Course completion is NOT stored here; it must come from Enrollment.
const toView = (lp) => ({
  _id: lp._id,
  title: lp.title,
  description: lp.description,
  courses: [...lp.courses].sort(byOrder).map((entry) => {
    const c = entry.course && entry.course._id ? entry.course : null;
    return {
      _id: entry._id,
      order: entry.order,
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
        : entry.course || null,
      courseAvailable: !!c && c.published === true && !c.deletedAt,
    };
  }),
  customItems: [...lp.customItems].sort(byOrder).map((i) => ({
    _id: i._id,
    title: i.title,
    description: i.description,
    order: i.order,
    completed: i.completed,
  })),
  createdAt: lp.createdAt,
  updatedAt: lp.updatedAt,
});

// Accepts a Mongoose document (after save) and returns the public view with courses populated.
const docToView = async (doc) => {
  await doc.populate(COURSE_POPULATE);
  return toView(doc.toObject());
};

// Ownership is enforced here for every read and mutation.
const findOwned = (id, userId) => LearningPath.findOne({ _id: id, user: userId });

// ---------- handlers ----------

// POST /api/learning-paths
const createLearningPath = async (req, res) => {
  try {
    const bodyError = checkBody(req.body, ['title', 'description', 'courses', 'customItems']);
    if (bodyError) return fail(res, 400, bodyError);
    const { title, description, courses = [], customItems = [] } = req.body;

    if (title === undefined) return fail(res, 400, 'title is required');
    const stringError = checkStrings(req.body, ['title', 'description']);
    if (stringError) return fail(res, 400, stringError);
    if (!Array.isArray(courses)) return fail(res, 400, 'courses must be an array');
    if (!Array.isArray(customItems)) return fail(res, 400, 'customItems must be an array');

    for (const entry of courses) {
      const entryError = isPlainObject(entry) ? checkCourseEntry(entry) : 'Each course entry must be an object';
      if (entryError) return fail(res, 400, `courses: ${entryError}`);
    }
    const courseIds = courses.map((c) => c.course);
    if (new Set(courseIds).size !== courseIds.length) {
      return fail(res, 400, 'courses: the same course cannot be added twice');
    }
    if (courseIds.length && (await countAvailableCourses(courseIds)) !== courseIds.length) {
      return fail(res, 400, 'courses: one or more courses do not exist');
    }

    for (const item of customItems) {
      const itemError = isPlainObject(item) ? checkCustomItem(item) : 'Each custom item must be an object';
      if (itemError) return fail(res, 400, `customItems: ${itemError}`);
    }

    const created = await LearningPath.create({
      user: req.user.id, // always from the JWT
      title,
      description,
      courses,
      customItems,
    });

    return res.status(201).json({ success: true, learningPath: await docToView(created) });
  } catch (err) {
    return handleError(res, err, 'Create learning path');
  }
};

// GET /api/learning-paths
const getMyLearningPaths = async (req, res) => {
  try {
    const paths = await LearningPath.find({ user: req.user.id })
      .populate(COURSE_POPULATE)
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    return res.status(200).json({ success: true, learningPaths: paths.map(toView) });
  } catch (err) {
    return handleError(res, err, 'Get learning paths');
  }
};

// GET /api/learning-paths/:id
const getLearningPath = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid learning path ID');
    const lp = await findOwned(req.params.id, req.user.id).populate(COURSE_POPULATE).lean();
    if (!lp) return fail(res, 404, 'Learning path not found');
    return res.status(200).json({ success: true, learningPath: toView(lp) });
  } catch (err) {
    return handleError(res, err, 'Get learning path');
  }
};

// PUT /api/learning-paths/:id   (title, description only)
const updateLearningPath = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid learning path ID');
    const bodyError = checkBody(req.body, ['title', 'description']);
    if (bodyError) return fail(res, 400, bodyError);
    if (req.body.title === undefined && req.body.description === undefined) {
      return fail(res, 400, 'Provide title and/or description');
    }
    const stringError = checkStrings(req.body, ['title', 'description']);
    if (stringError) return fail(res, 400, stringError);

    const lp = await findOwned(req.params.id, req.user.id);
    if (!lp) return fail(res, 404, 'Learning path not found');

    if (req.body.title !== undefined) lp.title = req.body.title;
    if (req.body.description !== undefined) lp.description = req.body.description;
    await lp.save();

    return res.status(200).json({ success: true, learningPath: await docToView(lp) });
  } catch (err) {
    return handleError(res, err, 'Update learning path');
  }
};

// DELETE /api/learning-paths/:id   (hard delete; courses and enrollments are untouched)
const deleteLearningPath = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid learning path ID');
    const result = await LearningPath.deleteOne({ _id: req.params.id, user: req.user.id });
    if (result.deletedCount === 0) return fail(res, 404, 'Learning path not found');
    return res.status(200).json({ success: true, message: 'Learning path deleted' });
  } catch (err) {
    return handleError(res, err, 'Delete learning path');
  }
};

// POST /api/learning-paths/:id/courses
const addCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return fail(res, 400, 'Invalid learning path ID');
    const entryError = isPlainObject(req.body) ? checkCourseEntry(req.body) : 'Request body must be a JSON object';
    if (entryError) return fail(res, 400, entryError);
    const { course, order } = req.body;

    const lp = await findOwned(id, req.user.id);
    if (!lp) return fail(res, 404, 'Learning path not found');

    if (lp.courses.some((c) => c.course.toString() === course)) {
      return fail(res, 409, 'Course is already in this learning path');
    }
    if ((await countAvailableCourses([course])) !== 1) return fail(res, 404, 'Course not found');

    // Atomic guard: the $ne condition stops duplicates even if two requests race.
    const result = await LearningPath.updateOne(
      { _id: id, user: req.user.id, 'courses.course': { $ne: course } },
      { $push: { courses: { course, order } } },
      { runValidators: true }
    );
    if (result.modifiedCount === 0) return fail(res, 409, 'Course is already in this learning path');

    const updated = await findOwned(id, req.user.id);
    return res.status(201).json({ success: true, learningPath: await docToView(updated) });
  } catch (err) {
    return handleError(res, err, 'Add course');
  }
};

// DELETE /api/learning-paths/:id/courses/:courseId   (Enrollment is not touched)
const removeCourse = async (req, res) => {
  try {
    const { id, courseId } = req.params;
    if (!isValidId(id)) return fail(res, 400, 'Invalid learning path ID');
    if (!isValidId(courseId)) return fail(res, 400, 'Invalid course ID');

    const lp = await findOwned(id, req.user.id);
    if (!lp) return fail(res, 404, 'Learning path not found');

    const index = lp.courses.findIndex((c) => c.course.toString() === courseId);
    if (index === -1) return fail(res, 404, 'Course is not in this learning path');

    lp.courses.splice(index, 1);
    await lp.save();
    return res.status(200).json({ success: true, learningPath: await docToView(lp) });
  } catch (err) {
    return handleError(res, err, 'Remove course');
  }
};

// POST /api/learning-paths/:id/custom-items   (no limit on how many items a user can add)
const addCustomItem = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, 'Invalid learning path ID');
    const itemError = isPlainObject(req.body) ? checkCustomItem(req.body) : 'Request body must be a JSON object';
    if (itemError) return fail(res, 400, itemError);

    const lp = await findOwned(req.params.id, req.user.id);
    if (!lp) return fail(res, 404, 'Learning path not found');

    const { title, description, order } = req.body;
    lp.customItems.push({ title, description, order }); // completed defaults to false
    await lp.save();

    const added = lp.customItems[lp.customItems.length - 1];
    return res.status(201).json({
      success: true,
      customItem: { _id: added._id, title: added.title, description: added.description, order: added.order, completed: added.completed },
      learningPath: await docToView(lp),
    });
  } catch (err) {
    return handleError(res, err, 'Add custom item');
  }
};

// PUT /api/learning-paths/:id/custom-items/:itemId   (title, description, order)
const updateCustomItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    if (!isValidId(id)) return fail(res, 400, 'Invalid learning path ID');
    if (!isValidId(itemId)) return fail(res, 400, 'Invalid custom item ID');
    const bodyError = checkBody(req.body, ['title', 'description', 'order']);
    if (bodyError) return fail(res, 400, bodyError);
    const { title, description, order } = req.body;
    if (title === undefined && description === undefined && order === undefined) {
      return fail(res, 400, 'Provide title, description and/or order');
    }
    const stringError = checkStrings(req.body, ['title', 'description']);
    if (stringError) return fail(res, 400, stringError);
    if (order !== undefined && !isPositiveInt(order)) return fail(res, 400, 'order must be a positive integer');

    const lp = await findOwned(id, req.user.id);
    if (!lp) return fail(res, 404, 'Learning path not found');
    const item = lp.customItems.id(itemId);
    if (!item) return fail(res, 404, 'Custom item not found');

    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (order !== undefined) item.order = order;
    await lp.save();

    return res.status(200).json({ success: true, learningPath: await docToView(lp) });
  } catch (err) {
    return handleError(res, err, 'Update custom item');
  }
};

// DELETE /api/learning-paths/:id/custom-items/:itemId
const deleteCustomItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    if (!isValidId(id)) return fail(res, 400, 'Invalid learning path ID');
    if (!isValidId(itemId)) return fail(res, 400, 'Invalid custom item ID');

    const lp = await findOwned(id, req.user.id);
    if (!lp) return fail(res, 404, 'Learning path not found');
    const index = lp.customItems.findIndex((i) => i._id.toString() === itemId);
    if (index === -1) return fail(res, 404, 'Custom item not found');

    lp.customItems.splice(index, 1);
    await lp.save();
    return res.status(200).json({ success: true, learningPath: await docToView(lp) });
  } catch (err) {
    return handleError(res, err, 'Delete custom item');
  }
};

// Shared by complete / uncomplete. Setting the same value twice is harmless (idempotent).
const setCustomItemCompleted = (completed, label) => async (req, res) => {
  try {
    const { id, itemId } = req.params;
    if (!isValidId(id)) return fail(res, 400, 'Invalid learning path ID');
    if (!isValidId(itemId)) return fail(res, 400, 'Invalid custom item ID');

    const lp = await findOwned(id, req.user.id);
    if (!lp) return fail(res, 404, 'Learning path not found');
    const item = lp.customItems.id(itemId);
    if (!item) return fail(res, 404, 'Custom item not found');

    item.completed = completed;
    await lp.save();
    return res.status(200).json({ success: true, learningPath: await docToView(lp) });
  } catch (err) {
    return handleError(res, err, label);
  }
};

module.exports = {
  createLearningPath,
  getMyLearningPaths,
  getLearningPath,
  updateLearningPath,
  deleteLearningPath,
  addCourse,
  removeCourse,
  addCustomItem,
  updateCustomItem,
  deleteCustomItem,
  completeCustomItem: setCustomItemCompleted(true, 'Complete custom item'),
  uncompleteCustomItem: setCustomItemCompleted(false, 'Uncomplete custom item'),
};