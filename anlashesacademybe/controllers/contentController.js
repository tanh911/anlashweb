import Post from "../models/Post.js";
import Joi from "joi";
// Validation schemas - cho phép string rỗng
const featureSchema = Joi.object({
  icon: Joi.string().allow("").optional(),
  title: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
});

const ctaSchema = Joi.object({
  title: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
  buttonText: Joi.string().allow("").optional(),
});

const statSchema = Joi.object({
  number: Joi.string().allow("").optional(),
  label: Joi.string().allow("").optional(),
});

// Schema cho blog posts
const postSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).required(),
  author: Joi.string().min(1).max(100).required(),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublished: Joi.boolean().optional(),
});

const contentSchema = Joi.object({
  features: Joi.array().items(featureSchema).optional(),
  cta: ctaSchema.optional(),
  stats: Joi.array().items(statSchema).optional(),
  posts: Joi.array().items(postSchema).optional(),
});

// Lấy nội dung trang chủ - TRẢ VỀ Ô TRỐNG NẾU CHƯA CÓ
export const getHomeContent = async (req, res) => {
  try {
    let content = await Content.findOne({ page: "home" });

    if (!content) {
      // Tạo content với các ô TRỐNG hoàn toàn
      content = new Content({
        page: "home",
        features: [
          { icon: "", title: "", description: "" },
          { icon: "", title: "", description: "" },
          { icon: "", title: "", description: "" },
        ],
        cta: {
          title: "",
          description: "",
          buttonText: "",
        },
        stats: [
          { number: "", label: "" },
          { number: "", label: "" },
          { number: "", label: "" },
        ],
        posts: [], // Thêm posts rỗng
      });
      await content.save();
    }

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error("Get home content error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Cập nhật nội dung trang chủ
export const updateHomeContent = async (req, res) => {
  try {
    const { error, value } = contentSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ: " + error.details[0].message,
      });
    }

    const { features, cta, stats, posts } = req.body;

    const content = await Content.findOneAndUpdate(
      { page: "home" },
      {
        features: features || [],
        cta: cta || {},
        stats: stats || [],
        posts: posts || [],
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật nội dung thành công",
      data: content,
    });
  } catch (error) {
    console.error("Update home content error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};
export const uploadPostImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file ảnh",
      });
    }

    console.log("📤 Uploading post image:", req.file.originalname);

    // Upload lên Cloudinary
    const imageUrl = await uploadToCloudinary(req.file);

    console.log("✅ Image uploaded:", imageUrl);

    res.status(200).json({
      success: true,
      message: "Upload ảnh thành công",
      data: {
        imageUrl: imageUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error uploading post image:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi upload ảnh",
      error: error.message,
    });
  }
};
// ==================== BLOG POSTS ROUTES ====================

// Tạo bài viết mới
// controllers/contentController.js
export const createPost = async (req, res) => {
  try {
    console.log("📝 Creating new post with data:", req.body);

    const { title, content, author, status, tags } = req.body;

    // Validation đơn giản
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề là bắt buộc",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nội dung là bắt buộc",
      });
    }

    const postData = {
      title: title.trim(),
      content: content.trim(),
      author: author || "Admin",
      status: status || "published",
      tags: Array.isArray(tags) ? tags : [],
    };

    const newPost = new Post(postData);
    const savedPost = await newPost.save();

    console.log("✅ Post created:", savedPost._id);

    res.status(201).json({
      success: true,
      message: "Bài viết đã được tạo thành công",
      data: savedPost,
    });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo bài viết",
      error: error.message,
    });
  }
};

// Lấy tất cả bài viết
export const getAllPosts = async (req, res) => {
  try {
    const content = await Content.findOne({ page: "home" });

    const posts = content?.posts || [];

    res.status(200).json({
      success: true,
      data: posts,
      total: posts.length,
    });
  } catch (error) {
    console.error("Get all posts error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Lấy bài viết theo ID
export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const content = await Post.findOne(
      {
        page: "home",
        "posts._id": postId,
      },
      {
        "posts.$": 1,
      }
    );

    if (!content || !content.posts || content.posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết",
      });
    }

    const post = content.posts[0];

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Get post by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Cập nhật bài viết
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { error, value } = postSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ: " + error.details[0].message,
      });
    }

    const { title, content, author, tags, isPublished } = req.body;

    const updatedContent = await Content.findOneAndUpdate(
      {
        page: "home",
        "posts._id": postId,
      },
      {
        $set: {
          "posts.$.title": title,
          "posts.$.content": content,
          "posts.$.author": author,
          "posts.$.tags": tags || [],
          "posts.$.isPublished": isPublished !== undefined ? isPublished : true,
          "posts.$.updatedAt": new Date(),
        },
      },
      {
        new: true,
      }
    );

    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết để cập nhật",
      });
    }

    const updatedPost = updatedContent.posts.id(postId);

    res.status(200).json({
      success: true,
      message: "Bài viết đã được cập nhật thành công",
      data: updatedPost,
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Xóa bài viết
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const updatedContent = await Content.findOneAndUpdate(
      { page: "home" },
      {
        $pull: {
          posts: { _id: postId },
        },
      },
      {
        new: true,
      }
    );

    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết để xóa",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bài viết đã được xóa thành công",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Lấy bài viết published (cho public access)
// controllers/contentController.js
export const getPublishedPosts = async (req, res) => {
  try {
    console.log("📝 Fetching published posts...");

    const posts = await Post.find({ status: "published" })
      .sort({ createdAt: -1 })
      .select("-__v");

    console.log(`✅ Found ${posts.length} published posts`);

    res.status(200).json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("❌ Error fetching published posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching published posts",
      error: error.message,
    });
  }
};

// ==================== CÁC HÀM CŨ GIỮ NGUYÊN ====================

// Lấy nội dung theo page name
export const getContentByPage = async (req, res) => {
  try {
    const { page } = req.params;

    let content = await Content.findOne({ page });

    if (!content) {
      // Tạo page mới với nội dung trống
      content = new Content({
        page: page,
        features: [],
        cta: {},
        stats: [],
        posts: [],
      });
      await content.save();
    }

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error("Get content by page error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Cập nhật nội dung theo page name
export const updateContentByPage = async (req, res) => {
  try {
    const { page } = req.params;
    const { error, value } = contentSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ: " + error.details[0].message,
      });
    }

    const { features, cta, stats, posts } = req.body;

    const content = await Content.findOneAndUpdate(
      { page },
      {
        features: features || [],
        cta: cta || {},
        stats: stats || [],
        posts: posts || [],
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật nội dung thành công",
      data: content,
    });
  } catch (error) {
    console.error("Update content by page error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Xóa nội dung
export const deleteContent = async (req, res) => {
  try {
    const { page } = req.params;

    await Content.findOneAndDelete({ page });

    res.status(200).json({
      success: true,
      message: "Xóa nội dung thành công",
    });
  } catch (error) {
    console.error("Delete content error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};
