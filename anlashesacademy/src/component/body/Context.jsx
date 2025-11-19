import React, { useState } from "react";
import "./Context.css";

const ContentEditor = ({ homeContent, onSave }) => {
  const [editingContent, setEditingContent] = useState(
    JSON.parse(JSON.stringify(homeContent))
  );
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editingContent);
      setIsEditing(false);
    } catch (error) {
      // Error handled in parent
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingContent(JSON.parse(JSON.stringify(homeContent)));
    setIsEditing(false);
  };

  const updateFeature = (index, field, value) => {
    const updatedFeatures = [...editingContent.features];
    updatedFeatures[index][field] = value;
    setEditingContent({ ...editingContent, features: updatedFeatures });
  };

  const updateStat = (index, field, value) => {
    const updatedStats = [...editingContent.stats];
    updatedStats[index][field] = value;
    setEditingContent({ ...editingContent, stats: updatedStats });
  };

  const updateCta = (field, value) => {
    setEditingContent({
      ...editingContent,
      cta: { ...editingContent.cta, [field]: value },
    });
  };

  if (!isEditing) {
    return (
      <div className="content-editor-toggle">
        <button onClick={() => setIsEditing(true)} className="edit-content-btn">
          📝 Chỉnh sửa bài viết
        </button>
      </div>
    );
  }

  return (
    <div className="content-editor">
      <h3>Chỉnh sửa bài viết</h3>

      {/* Features Editor */}
      <div className="editor-section">
        <h4>Features</h4>
        {editingContent.features.map((feature, index) => (
          <div key={index} className="editor-item">
            <h5>Feature {index + 1}</h5>
            <input
              type="text"
              value={feature.icon}
              onChange={(e) => updateFeature(index, "icon", e.target.value)}
              placeholder="Icon"
            />
            <input
              type="text"
              value={feature.title}
              onChange={(e) => updateFeature(index, "title", e.target.value)}
              placeholder="Title"
            />
            <textarea
              value={feature.description}
              onChange={(e) =>
                updateFeature(index, "description", e.target.value)
              }
              placeholder="Description"
            />
          </div>
        ))}
      </div>

      {/* CTA Editor */}
      <div className="editor-section">
        <h4>Call to Action</h4>
        <input
          type="text"
          value={editingContent.cta.title}
          onChange={(e) => updateCta("title", e.target.value)}
          placeholder="CTA Title"
        />
        <textarea
          value={editingContent.cta.description}
          onChange={(e) => updateCta("description", e.target.value)}
          placeholder="CTA Description"
        />
        <input
          type="text"
          value={editingContent.cta.buttonText}
          onChange={(e) => updateCta("buttonText", e.target.value)}
          placeholder="Button Text"
        />
      </div>

      {/* Stats Editor */}
      <div className="editor-section">
        <h4>Statistics</h4>
        {editingContent.stats.map((stat, index) => (
          <div key={index} className="editor-item">
            <h5>Stat {index + 1}</h5>
            <input
              type="text"
              value={stat.number}
              onChange={(e) => updateStat(index, "number", e.target.value)}
              placeholder="Number"
            />
            <input
              type="text"
              value={stat.label}
              onChange={(e) => updateStat(index, "label", e.target.value)}
              placeholder="Label"
            />
          </div>
        ))}
      </div>

      <div className="editor-actions">
        <button onClick={handleSave} className="save-btn" disabled={saving}>
          {saving ? "Saving..." : "Lưu bài viết"}
        </button>
        <button onClick={handleCancel} className="cancel-btn" disabled={saving}>
          Hủy
        </button>
      </div>
    </div>
  );
};

export default ContentEditor;
