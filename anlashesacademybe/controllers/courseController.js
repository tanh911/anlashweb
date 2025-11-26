import Course from "../models/Course.js";

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().select("-curriculum");

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Get courses error:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách khóa học",
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khóa học",
      });
    }

    course.studentsEnrolled += 1;
    await course.save();

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin khóa học",
    });
  }
};

const createCourse = async (req, res) => {
  try {
    // Validate required fields based on model
    const requiredFields = ["title", "description", "price", "duration"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Thiếu thông tin bắt buộc: ${missingFields.join(", ")}`,
      });
    }

    // Validate price is a valid number
    const price = parseFloat(req.body.price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Giá khóa học phải là số và không được âm",
      });
    }

    // Validate level enum values
    const validLevels = ["beginner", "intermediate", "advanced"];
    if (req.body.level && !validLevels.includes(req.body.level)) {
      return res.status(400).json({
        success: false,
        message:
          "Cấp độ không hợp lệ. Chỉ chấp nhận: beginner, intermediate, advanced",
      });
    }

    // Validate file type if image is uploaded
    if (req.file) {
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxFileSize = 5 * 1024 * 1024; // 5MB

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Định dạng file không hợp lệ. Chỉ chấp nhận JPEG, PNG, WebP",
        });
      }

      if (req.file.size > maxFileSize) {
        return res.status(400).json({
          success: false,
          message: "Kích thước file không được vượt quá 5MB",
        });
      }
    }

    // Prepare course data according to model schema
    const courseData = {
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      price: price,
      duration: req.body.duration.trim(),
      ...(req.body.level && { level: req.body.level }),
      ...(req.file && {
        image: {
          url: `/uploads/${req.file.filename}`,
          publicId: req.file.filename,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
      }),
    };

    // Validate title length
    if (courseData.title.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề không được vượt quá 200 ký tự",
      });
    }

    // Create and save course
    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      success: true,
      message: "Tạo khóa học thành công",
      data: course,
    });
  } catch (error) {
    console.error("Create course error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: errorMessages,
      });
    }

    // Handle duplicate key errors (if you add unique constraint to title)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Khóa học với tiêu đề này đã tồn tại",
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo khóa học",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
const updateCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: errors.array(),
      });
    }

    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = {
        url: `/uploads/${req.file.filename}`,
        publicId: req.file.filename,
      };
    }

    // Parse array JSON
    const arrayFields = [
      "features",
      "requirements",
      "whatYouWillLearn",
      "tags",
      "curriculum",
    ];
    arrayFields.forEach((field) => {
      if (typeof updateData[field] === "string") {
        updateData[field] = JSON.parse(updateData[field]);
      }
    });

    // Parse category JSON
    if (typeof updateData.category === "string") {
      updateData.category = JSON.parse(updateData.category);
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Cập nhật khóa học thành công",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật khóa học",
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khóa học",
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Xóa khóa học thành công",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa khóa học",
    });
  }
};

// @desc    Toggle publish
const togglePublish = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khóa học",
      });
    }

    course.isPublished = !course.isPublished;
    await course.save();

    res.json({
      success: true,
      message: `Khóa học đã được ${course.isPublished ? "xuất bản" : "ẩn"}`,
      data: course,
    });
  } catch (error) {
    console.error("Toggle publish error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi thay đổi trạng thái khóa học",
    });
  }
};

// @desc    Get featured
const getFeaturedCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      isFeatured: true,
      isPublished: true,
    })
      .limit(6)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Get featured courses error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy khóa học nổi bật",
    });
  }
};

// @desc    Category filter
// @route   GET /api/courses/category/:category
const getCoursesByCategory = async (req, res) => {
  try {
    const courses = await Course.find({
      "category.name": req.params.category, // 🔥 Category sub-field
      isPublished: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Get courses by category error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy khóa học theo danh mục",
    });
  }
};

export {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  getFeaturedCourses,
  getCoursesByCategory,
};
