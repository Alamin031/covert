/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';


import {Button} from '../../components/ui/button';
import {Input} from '../../components/ui/input';
import {Label} from '../../components/ui/label';
import {withProtectedRoute} from '../../lib/auth/protected-route';
import { useEffect, useState, useRef } from 'react';
import usersService from '../../lib/api/services/users';



function AdminSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Tabs: 'profile' | 'roles' | 'permissions'
  const [activeTab, setActiveTab] = useState<'profile' | 'roles' | 'permissions'>('profile');

  // Roles & permissions UI state
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [permsLoading, setPermsLoading] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] as string[] });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  useEffect(() => {
    usersService.getCurrentUser()
      .then((u) => {
        setUser(u);
        setEdit({ name: u.name || "", email: u.email || "", phone: u.phone || "" });
        setImagePreview(u.image || null);
      })
      .catch((err) => setError(err?.message || "Failed to load user"))
      .finally(() => setLoading(false));
    // load roles & permissions when component mounts
    fetchRoles();
    fetchPermissions();
  }, []);

  // Fetch roles from backend
  async function fetchRoles() {
    setRolesLoading(true);
    try {
      const res = await fetch('/roles');
      if (!res.ok) throw new Error('Failed to load roles');
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // keep user-facing error state
      setError(err?.message || 'Failed to load roles');
    } finally {
      setRolesLoading(false);
    }
  }

  // Fetch list of available permissions (optional backend endpoint)
  async function fetchPermissions() {
    setPermsLoading(true);
    try {
      const res = await fetch('/permissions');
      if (!res.ok) {
        // endpoint might not exist; fall back to empty array
        setPermissions([]);
        return;
      }
      const data = await res.json();
      setPermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setPermissions([]);
    } finally {
      setPermsLoading(false);
    }
  }

  // Create or update role
  async function handleSaveRole(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { name: roleForm.name, permissions: roleForm.permissions };
      let res;
      if (editingRoleId) {
        res = await fetch(`/roles/${editingRoleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error('Failed to save role');
      await fetchRoles();
      setRoleForm({ name: '', permissions: [] });
      setEditingRoleId(null);
      setSuccess('Role saved successfully.');
    } catch (err: any) {
      setError(err?.message || 'Could not save role');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditRole(role: any) {
    setEditingRoleId(role.id || null);
    setRoleForm({ name: role.name || '', permissions: role.permissions || [] });
    setActiveTab('roles');
  }

  async function handleDeleteRole(roleId: string) {
    if (!confirm('Delete this role?')) return;
    setError('');
    try {
      const res = await fetch(`/roles/${roleId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete role');
      await fetchRoles();
      setSuccess('Role deleted.');
    } catch (err: any) {
      setError(err?.message || 'Could not delete role');
    }
  }

  function toggleRolePermission(permission: string) {
    setRoleForm((s) => {
      const has = s.permissions.includes(permission);
      return { ...s, permissions: has ? s.permissions.filter((p) => p !== permission) : [...s.permissions, permission] };
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEdit({ ...edit, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      let payload: any;
      let useFormData = false;
      if (imageFile) {
        useFormData = true;
      }
      if (useFormData) {
        const formData = new FormData();
        formData.append("name", edit.name);
        formData.append("email", edit.email);
        formData.append("phone", edit.phone);
        if (imageFile) formData.append("image", imageFile);
        payload = formData;
      } else {
        payload = {
          name: edit.name,
          email: edit.email,
          phone: edit.phone,
        };
      }
      const updated = await usersService.update(user.id, payload);
      setUser(updated);
      setSuccess("Profile updated successfully.");
      setImageFile(null);
    } catch (err: any) {
      setError(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pt-4">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and account settings.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-blue-800 dark:text-blue-200 font-medium flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
          Loading your profile...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200 font-medium flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          {error}
        </div>
      )}

      {/* Success State */}
      {success && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-800 dark:text-green-200 font-medium flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          {success}
        </div>
      )}

      {!loading && user && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setActiveTab('profile')} className={`px-3 py-1 rounded-md font-medium ${activeTab === 'profile' ? 'bg-primary text-white' : 'bg-muted'}`}>
              Profile
            </button>
            <button type="button" onClick={() => setActiveTab('roles')} className={`px-3 py-1 rounded-md font-medium ${activeTab === 'roles' ? 'bg-primary text-white' : 'bg-muted'}`}>
              Roles
            </button>
            <button type="button" onClick={() => setActiveTab('permissions')} className={`px-3 py-1 rounded-md font-medium ${activeTab === 'permissions' ? 'bg-primary text-white' : 'bg-muted'}`}>
              Permissions
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-6">Profile Picture</h2>
                
                <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                  {/* Avatar Preview */}
                  <div className="relative shrink-0">
                    <div className="relative w-40 h-40 rounded-full border-4 border-border bg-muted flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Profile" className="object-cover w-full h-full" />
                      ) : (
                        <div className="text-center">
                          <div className="text-6xl text-primary/40">👤</div>
                        </div>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2 shadow-lg">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Upload Area */}
                  <div className="flex-grow w-full md:w-auto">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold mb-2">Upload New Picture</h3>
                        <p className="text-sm text-muted-foreground mb-4">Update your profile picture to personalize your account</p>
                      </div>

                      {/* Drag & Drop Area */}
                      <div className="relative group">
                        <input
                          id="image"
                          name="image"
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/50 rounded-lg p-8 text-center transition-all duration-300 bg-muted/30 group-hover:bg-primary/5">
                          <div className="space-y-2">
                            <div className="flex justify-center">
                              <div className="p-3 rounded-full bg-primary/10 text-primary">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Click to upload or drag and drop</p>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="bg-blue-100/60 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
                        <ul className="text-xs text-blue-900 dark:text-blue-100 space-y-2 font-semibold">
                          <li className="flex items-center gap-2.5">
                            <span className="inline-block w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0"></span>
                            Recommended size: 400x400px
                          </li>
                          <li className="flex items-center gap-2.5">
                            <span className="inline-block w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0"></span>
                            Supported formats: JPG, PNG, GIF
                          </li>
                          <li className="flex items-center gap-2.5">
                            <span className="inline-block w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0"></span>
                            Maximum file size: 5MB
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Profile Section */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold">Edit Profile</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={edit.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={edit.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={edit.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      className="h-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto h-11 font-semibold"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </Button>
              </div>

              {/* Account Information Section */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Account Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">User ID</p>
                    <p className="font-mono text-sm font-semibold break-all">{user.id}</p>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Role</p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Admin Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        user.isAdmin
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">All Roles</p>
                    <p className="text-sm font-semibold">
                      {Array.isArray(user.roles) && user.roles.length > 0
                        ? user.roles.join(', ')
                        : '-'}
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Created At</p>
                    <p className="text-sm font-semibold">{user.createdAt}</p>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                    <p className="text-sm font-semibold">{user.updatedAt}</p>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Roles</h2>
                <button className="btn" onClick={() => { setEditingRoleId(null); setRoleForm({ name: '', permissions: [] }); }}>
                  New Role
                </button>
              </div>

              <form onSubmit={handleSaveRole} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input placeholder="Role name" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} />
                  <div className="col-span-1 md:col-span-2">
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto p-2 border rounded">
                      {permsLoading ? (
                        <div>Loading permissions...</div>
                      ) : permissions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No permission list available from server.</div>
                      ) : (
                        permissions.map((p) => (
                          <label key={p} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={roleForm.permissions.includes(p)} onChange={() => toggleRolePermission(p)} />
                            <span className="truncate">{p}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>{editingRoleId ? 'Update Role' : 'Create Role'}</Button>
                  <Button type="button" onClick={() => { setEditingRoleId(null); setRoleForm({ name: '', permissions: [] }); }}>Reset</Button>
                </div>
              </form>

              <div className="space-y-2">
                {rolesLoading ? <div>Loading roles...</div> : (
                  roles.map((r) => (
                    <div key={r.id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{r.name}</div>
                        <div className="text-sm text-muted-foreground">{Array.isArray(r.permissions) ? r.permissions.join(', ') : '-'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-2 py-1 bg-yellow-100 rounded" onClick={() => handleEditRole(r)}>Edit</button>
                        <button className="px-2 py-1 bg-red-100 rounded" onClick={() => handleDeleteRole(r.id)}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Permissions</h2>
              {permsLoading ? <div>Loading permissions...</div> : (
                permissions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No permissions available from the server. Implement a `/permissions` endpoint that returns an array of permission keys.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {permissions.map((p) => (
                      <div key={p} className="p-2 border rounded text-sm">{p}</div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default withProtectedRoute(AdminSettingsPage, {
  requiredRoles: ['admin'],
  fallbackTo: '/login',
  showLoader: true,
});
