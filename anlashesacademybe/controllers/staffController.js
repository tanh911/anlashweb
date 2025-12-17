// staffController.js
import Staff from "../models/Staff.js";
import mongoose from "mongoose";

// ==================== CRUD OPERATIONS ====================

// @desc    Lấy tất cả nhân viên (dành cho admin)
// @route   GET /api/staff
// @access  Private/Admin
export const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: staff,
      total: staff.length,
      message: "Lấy danh sách nhân viên thành công",
    });
  } catch (error) {
    console.error("Error in getAllStaff:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách nhân viên",
    });
  }
};

// @desc    Lấy chi tiết nhân viên
// @route   GET /api/staff/:id
// @access  Private/Admin
export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ",
      });
    }

    const staff = await Staff.findById(id).lean();

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Error in getStaffById:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin nhân viên",
    });
  }
};

// @desc    Thêm nhân viên mới
// @route   POST /api/staff
// @access  Private/Admin
export const createStaff = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên nhân viên",
      });
    }

    // Create new staff
    const staff = new Staff({
      name: name.trim(),
    });

    await staff.save();

    res.status(201).json({
      success: true,
      message: "Thêm nhân viên thành công",
      data: staff,
    });
  } catch (error) {
    console.error("Error in createStaff:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm nhân viên",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Cập nhật thông tin nhân viên
// @route   PUT /api/staff/:id
// @access  Private/Admin
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ",
      });
    }

    // Validate name
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên nhân viên",
      });
    }

    // Check if staff exists
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    // Update staff
    const updatedStaff = await Staff.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Cập nhật nhân viên thành công",
      data: updatedStaff,
    });
  } catch (error) {
    console.error("Error in updateStaff:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật nhân viên",
    });
  }
};

// @desc    Xóa nhân viên
// @route   DELETE /api/staff/:id
// @access  Private/Admin
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nhân viên không hợp lệ",
      });
    }

    // Check if staff exists
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    // Delete staff
    await Staff.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Xóa nhân viên thành công",
    });
  } catch (error) {
    console.error("Error in deleteStaff:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa nhân viên",
    });
  }
};

// @desc    Tìm kiếm nhân viên
// @route   GET /api/staff/search
// @access  Private/Admin
export const searchStaff = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa tìm kiếm",
      });
    }

    const searchQuery = {
      name: { $regex: keyword, $options: "i" },
    };

    const staff = await Staff.find(searchQuery).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: staff,
      total: staff.length,
      message: "Tìm kiếm nhân viên thành công",
    });
  } catch (error) {
    console.error("Error in searchStaff:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm kiếm nhân viên",
    });
  }
};

// ==================== EXISTING FUNCTIONS ====================

// @desc    Health check
// @route   GET /api/staff/health
// @access  Public
export const getStaffHealth = async (req, res) => {
  try {
    const staffCount = await Staff.countDocuments();
    res.json({
      status: "healthy",
      totalStaff: staffCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Service unavailable", error: error.message });
  }
};

// @desc    Lấy nhân viên khả dụng theo thời gian
// @route   GET /api/staff/available
// @access  Public
export const getAvailableStaff = async (req, res) => {
  try {
    const { date, time, service_type, duration = 60 } = req.query;

    // Validate input
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp ngày và giờ (date, time)",
      });
    }

    // Kiểm tra định dạng date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Định dạng ngày không hợp lệ (YYYY-MM-DD)",
      });
    }

    // Kiểm tra định dạng time
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({
        success: false,
        message: "Định dạng giờ không hợp lệ (HH:MM)",
      });
    }

    // Lấy tất cả nhân viên
    const allStaff = await Staff.find().select("name").lean();

    if (allStaff.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "Không có nhân viên nào khả dụng",
      });
    }

    // Vì model đơn giản, giả sử tất cả nhân viên đều khả dụng
    const availableStaff = allStaff.map((staff) => ({
      id: staff._id,
      name: staff.name,
      available: true,
      currentAppointments: 0,
      maxCapacity: 3, // Mặc định
      availableSlots: 3,
    }));

    res.json({
      success: true,
      data: availableStaff,
      meta: {
        date,
        time,
        service_type,
        total: availableStaff.length,
        requestedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in getAvailableStaff:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách nhân viên",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Lấy nhân viên theo loại dịch vụ
// @route   GET /api/staff/service/:serviceType
// @access  Public
export const getStaffByService = async (req, res) => {
  try {
    const { serviceType } = req.params;

    // Vì model đơn giản không có specialization, lấy tất cả
    const staff = await Staff.find()
      .select("name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        service_type: serviceType,
        staff,
        total: staff.length,
      },
    });
  } catch (error) {
    console.error("Error in getStaffByService:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy nhân viên theo loại dịch vụ",
    });
  }
};
