import { useState, useEffect } from 'react';
import { getCapsules, createCapsule, updateCapsule, deleteCapsule } from '../api.js';

const emptyForm = {
  project_name: '',
  prompt_title: '',
  prompt_version: '',
  prompt_text: '',
  response_summary: '',
  category: 'Coding',
  usefulness: 'Good',
  reviewed: false,
  improved: false,
  notes: '',
};

export default function Dashboard() {
  const [capsules, setCapsules] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadCapsules();
  }, []);

  async function loadCapsules() {
    try {
      const data = await getCapsules();
      setCapsules(data);
      setError(null);
    } catch (err) {
      setError('You need to log in first.');
    }
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      await updateCapsule(editingId, form);
    } else {
      await createCapsule(form);
    }
    setForm(emptyForm);
    setEditingId(null);
    loadCapsules();
  }

  function startEdit(capsule) {
    setForm({
      project_name: capsule.project_name,
      prompt_title: capsule.prompt_title,
      prompt_version: capsule.prompt_version || '',
      prompt_text: capsule.prompt_text,
      response_summary: capsule.response_summary || '',
      category: capsule.category || 'Coding',
      usefulness: capsule.usefulness || 'Good',
      reviewed: !!capsule.reviewed,
      improved: !!capsule.improved,
      notes: capsule.notes || '',
    });
    setEditingId(capsule.id);
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleDelete(id) {
    await deleteCapsule(id);
    loadCapsules();
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Your Prompts</h2>

      <form onSubmit={handleSubmit} className="card form-grid" style={{ marginBottom: 24 }}>
        <input placeholder="Project name" value={form.project_name} onChange={(e) => updateField('project_name', e.target.value)} required />
        <input placeholder="Prompt title" value={form.prompt_title} onChange={(e) => updateField('prompt_title', e.target.value)} required />
        <input placeholder="Version (e.g. v1)" value={form.prompt_version} onChange={(e) => updateField('prompt_version', e.target.value)} />
        <textarea placeholder="Prompt text" value={form.prompt_text} onChange={(e) => updateField('prompt_text', e.target.value)} required />
        <textarea placeholder="Response summary" value={form.response_summary} onChange={(e) => updateField('response_summary', e.target.value)} />

        <select value={form.category} onChange={(e) => updateField('category', e.target.value)}>
          <option>Coding</option>
          <option>Writing</option>
          <option>Research</option>
        </select>

        <select value={form.usefulness} onChange={(e) => updateField('usefulness', e.target.value)}>
          <option>Good</option>
          <option>Needs Improvement</option>
        </select>

        <label>
          <input type="checkbox" checked={form.reviewed} onChange={(e) => updateField('reviewed', e.target.checked)} style={{ width: 'auto' }} />
          Reviewed
        </label>

        <label>
          <input type="checkbox" checked={form.improved} onChange={(e) => updateField('improved', e.target.checked)} style={{ width: 'auto' }} />
          Improved
        </label>

        <textarea placeholder="Notes" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />

        <div>
          <button type="submit" className="btn btn-primary">{editingId ? 'Save changes' : 'Create'}</button>
          {editingId && <button type="button" onClick={cancelEdit} className="btn" style={{ marginLeft: 8 }}>Cancel</button>}
        </div>
      </form>

      {capsules.length === 0 && <p className="muted">No prompts saved yet — create your first one above.</p>}

      {capsules.map((c) => (
        <div className="card" key={c.id}>
          <h3 style={{ margin: '0 0 4px' }}>
            {c.prompt_title} {c.prompt_version && <span className="muted">({c.prompt_version})</span>}
          </h3>
          <p className="muted" style={{ margin: '0 0 10px' }}>{c.project_name}</p>
          <p>{c.prompt_text}</p>
          {c.response_summary && <p className="muted"><em>Summary: {c.response_summary}</em></p>}

          <div style={{ margin: '10px 0' }}>
            {c.category && <span className="tag">{c.category}</span>}
            {c.usefulness && <span className="tag">{c.usefulness}</span>}
            <span className="tag">{c.reviewed ? 'Reviewed' : 'Not reviewed'}</span>
            <span className="tag">{c.improved ? 'Improved' : 'Not improved'}</span>
          </div>

          {c.notes && <p className="muted">{c.notes}</p>}

          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => startEdit(c)}>Edit</button>
            <button className="btn btn-danger" onClick={() => handleDelete(c.id)} style={{ marginLeft: 8 }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}