import Service from "../models/Service.js";

// Lấy tất cả dịch vụ
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Thêm dịch vụ mới (admin)
export const createService = async (req, res) => {
  try {
    const { name, description, duration, price } = req.body;
    const service = new Service({ name, description, duration, price });
    await service.save();
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cập nhật dịch vụ (admin)
export const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Xóa dịch vụ (admin)
export const deleteService = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Service deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
