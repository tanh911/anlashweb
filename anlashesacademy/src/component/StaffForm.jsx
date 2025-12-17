import React, { useState, useEffect, useRef, useCallback } from "react";
import "./StaffForm.css"; // nếu có

const StaffForm = ({
  staffData,
  onChange = () => {}, // ✅ FIX TRIỆT ĐỂ
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState(staffData);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync form khi staffData thay đổi
  useEffect(() => {
    setFormData(staffData);
  }, [staffData]);

  // Auto focus input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert("Vui lòng nhập tên nhân viên");
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      setFormData((prev) => ({ ...prev, [name]: value }));

      // debounce onChange
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onChange({ ...formData, [name]: value });
      }, 150);
    },
    [onChange, formData]
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {staffData?._id ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
          </h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="staff-name">Tên nhân viên *</label>
            <input
              ref={inputRef}
              id="staff-name"
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="Nhập tên nhân viên"
              disabled={saving}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="btn-save"
              disabled={saving || !formData.name?.trim()}
            >
              {saving
                ? "Đang lưu..."
                : staffData?._id
                ? "Cập nhật"
                : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(StaffForm);
