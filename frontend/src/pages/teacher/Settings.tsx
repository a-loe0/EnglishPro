import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Button, Card, Input } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { teacherSidebarItems } from '../../config/teacherSidebar';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Avatar state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Messages
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMessage({ type: 'error', text: 'Name is required' });
      return;
    }

    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const updatedUser = await authService.updateProfile({ name: name.trim() });
      setUser(updatedUser);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update profile',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setSavingPassword(true);

    try {
      await authService.changePassword({ currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to change password',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAvatarMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    setUploadingAvatar(true);
    setAvatarMessage(null);

    try {
      const updatedUser = await authService.uploadAvatar(file);
      setUser(updatedUser);
      setAvatarMessage({ type: 'success', text: 'Profile picture updated' });
    } catch (err: any) {
      setAvatarMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to upload image',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title="Settings">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h2>

        {/* Profile Picture */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
          <div className="flex items-center gap-6">
            <div
              onClick={handleAvatarClick}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary cursor-pointer group"
            >
              {authService.getAvatarUrl(user?.avatarUrl) ? (
                <img
                  src={authService.getAvatarUrl(user?.avatarUrl)!}
                  alt={user?.name || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials(user?.name || 'U')}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <Button variant="secondary" onClick={handleAvatarClick} disabled={uploadingAvatar}>
                {uploadingAvatar ? 'Uploading...' : 'Change Picture'}
              </Button>
              <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          {avatarMessage && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                avatarMessage.type === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {avatarMessage.text}
            </div>
          )}
        </Card>

        {/* Profile Information */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
          {profileMessage && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                profileMessage.type === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {profileMessage.text}
            </div>
          )}
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <Input
              label="Email"
              type="email"
              value={user?.email || ''}
              placeholder="your@email.com"
              disabled
            />
            <p className="text-sm text-gray-500">Email cannot be changed</p>
            <div className="pt-2">
              <Button type="submit" variant="gradient" isLoading={savingProfile}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
          {passwordMessage && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                passwordMessage.type === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <div className="pt-2">
              <Button type="submit" variant="secondary" isLoading={savingPassword}>
                Change Password
              </Button>
            </div>
          </form>
        </Card>

        {/* Account Info */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account</h3>
          <p className="text-gray-600 mb-2">
            <span className="font-medium">Role:</span> {user?.role === 'TEACHER' ? 'Teacher' : 'Student'}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Member since:</span>{' '}
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </Card>

        {/* Sign Out */}
        <Card className="p-6 border-red-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out</h3>
          <p className="text-gray-500 mb-4">Sign out of your account on this device.</p>
          <Button variant="ghost" onClick={handleSignOut} className="text-red-600 hover:bg-red-50">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
