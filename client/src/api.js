export async function getCapsules() {
  const res = await fetch('/api/capsules', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load capsules');
  return res.json();
}

export async function createCapsule(data) {
  const res = await fetch('/api/capsules', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create capsule');
  return res.json();
}

export async function updateCapsule(id, data) {
  const res = await fetch(`/api/capsules/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update capsule');
  return res.json();
}

export async function deleteCapsule(id) {
  const res = await fetch(`/api/capsules/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete capsule');
  return res.json();
}