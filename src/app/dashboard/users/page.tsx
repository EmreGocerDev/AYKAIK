"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import ConfirmModal from '@/components/ConfirmModal';
import AddUserModal from '@/components/AddUserModal';
import EditUserModal from '@/components/EditUserModal';
import { deleteUser, getUserProfiles } from '@/app/actions';
import toast from 'react-hot-toast';

type UserProfile = {
  id: string; 
  full_name: string;
  role: string;
  region_id: number;
  email: string; 
  regions: { name: string } | null; 
};

// RPC'den dönen veri için bir tip oluşturalım
type UserProfileRpcResponse = {
    id: string;
    full_name: string;
    role: string;
    region_id: number;
    email: string;
    region_name: string;
};

export default function UsersPage() {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await getUserProfiles();
      
    if (error || !data) {
      toast.error('Kullanıcılar yüklenemedi.');
      console.error(error);
    } else {
      
      const formattedData = data.map((user: UserProfileRpcResponse) => ({
        ...user,
        regions: { name: user.region_name }
      }));
      setUsers(formattedData as UserProfile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const toastId = toast.loading('Kullanıcı siliniyor...');
    const result = await deleteUser(userToDelete.id);

    if (result.success) {
      toast.success(result.message, { id: toastId });
      fetchUsers();
    } else {
      toast.error(result.message, { id: toastId });
    }
    setUserToDelete(null);
  };

  return (
    <>
      <div className="p-4 md:p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>Yeni Kullanıcı Ekle</span>
            </button>
          </div>

          <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
            {loading ? <div className="text-center p-4">Yükleniyor...</div> : (
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.id} className="p-4 bg-white/5 rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{user.full_name} <span className="text-xs font-normal uppercase bg-gray-500/30 px-2 py-1 rounded-full">{user.role}</span></h3>
                      <p className="text-sm text-gray-300">Bölge: {user.regions?.name || 'Atanmamış'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setUserToEdit(user)} className="p-2 hover:bg-white/10 rounded-md" title="Düzenle"><Edit size={16} /></button>
                      
                      {user.role !== 'admin' && (
                        <button onClick={() => setUserToDelete(user)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-md" title="Sil"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                ))}
                {users.length === 0 && !loading && <p className="text-center text-gray-400 p-4">Sistemde yönetici veya koordinatör bulunmuyor.</p>}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {isAddModalOpen && <AddUserModal onClose={() => setIsAddModalOpen(false)} onUserAdded={fetchUsers} />}
      {userToEdit && <EditUserModal user={userToEdit} onClose={() => setUserToEdit(null)} onUserUpdated={fetchUsers} />}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Kullanıcıyı Sil"
        message={`'${userToDelete?.full_name}' adlı kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
      />
    </>
  );
}