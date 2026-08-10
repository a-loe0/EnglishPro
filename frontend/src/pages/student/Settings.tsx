import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Spinner, Avatar } from '../../components/common';
import { studentSidebarItems } from '../../config/studentSidebar';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { useTranslation } from '../../i18n';

export default function StudentSettings() {
  const navigate = useNavigate();
  const t = useTranslation();
  const { user, setUser, logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const updatedUser = await authService.uploadAvatar(file);
      setUser(updatedUser);
      setProfileMessage({ type: 'success', text: t('pictureUpdated') });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload picture';
      setProfileMessage({ type: 'error', text: message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const updatedUser = await authService.updateProfile({ name });
      setUser(updatedUser);
      setProfileMessage({ type: 'success', text: t('profileUpdated') });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      setProfileMessage({ type: 'error', text: message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('passwordMismatch') });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: t('passwordTooShort') });
      return;
    }

    setSavingPassword(true);

    try {
      await authService.changePassword({ currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: t('passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      setPasswordMessage({ type: 'error', text: message });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    }
    logout();
    navigate('/login');
  };

  return (
    <DashboardLayout sidebarItems={studentSidebarItems} title={t('settings')}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{t('accountSettings')}</h2>
          <p className="text-gray-500 mt-1">{t('manageAccount')}</p>
        </div>

        <div className="space-y-6">
          {/* Profile Picture */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profilePicture')}</h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  name={user?.name || ''}
                  src={authService.getAvatarUrl(user?.avatarUrl)}
                  size="xl"
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {t('changePicture')}
                </Button>
                <p className="text-sm text-gray-500 mt-2">{t('imageRequirements')}</p>
              </div>
            </div>
          </Card>

          {/* Profile Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile')}</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">{t('emailCannotChange')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('displayName')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              {profileMessage && (
                <p className={`text-sm ${profileMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {profileMessage.text}
                </p>
              )}
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? t('loading') : t('saveChanges')}
              </Button>
            </form>
          </Card>

          {/* Change Password */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('changePassword')}</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('currentPassword')}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('newPassword')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('confirmNewPassword')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              {passwordMessage && (
                <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordMessage.text}
                </p>
              )}
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? t('loading') : t('changePassword')}
              </Button>
            </form>
          </Card>

          {/* Sign Out */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('signOut')}</h3>
            <p className="text-gray-500 mb-4">{t('signOutDescription')}</p>
            <Button variant="danger" onClick={handleLogout}>
              {t('signOut')}
            </Button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
