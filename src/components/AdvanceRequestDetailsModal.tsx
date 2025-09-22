// YOL: src/components/AdvanceRequestDetailsModal.tsx

"use client";

import { useState } from 'react';
import { X, Check, Trash2, User, History, Wallet } from 'lucide-react';
import { coordinatorApproveAdvance, coordinatorRejectAdvance, adminApproveAdvance, adminRejectAdvance } from '@/app/actions';
import toast from 'react-hot-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { safeNewDate } from '@/lib/utils';
import type { CashAdvanceRequest } from '@/types/index';

type ModalProps = {
  request: CashAdvanceRequest;
  onClose: () => void;
};

export default function AdvanceRequestDetailsModal({ request, onClose }: ModalProps) {
  const { profile } = useSettings();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsSubmitting(true);
    let result;
    if (profile?.role === 'admin') {
      result = action === 'approve' 
        ? await adminApproveAdvance(request.id, notes) 
        : await adminRejectAdvance(request.id, notes);
    } else if (profile?.role === 'coordinator') {
      result = action === 'approve'
        ? await coordinatorApproveAdvance(request.id, notes)
        : await coordinatorRejectAdvance(request.id, notes);
    } else {
      toast.error("Bu işlemi yapma yetkiniz yok.");
      setIsSubmitting(false);
      return;
    }
    
    if (result && result.success) {
      toast.success(result.message);
      onClose();
    } else if(result) {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const canCoordinatorAct = profile?.role === 'coordinator' && request.status === 'pending';
  const canAdminAct = profile?.role === 'admin';
  const canTakeAction = canAdminAct || canCoordinatorAct;

  const approveText = profile?.role === 'admin' ? 'Nihai Onay' : 'Koordinatör Onayı';
  const rejectText = profile?.role === 'admin' ? 'Nihai Red' : 'Koordinatör Reddi';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/80 border border-white/10 p-6 rounded-2xl w-full max-w-2xl text-white max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Avans Talebi Detayı</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <User className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Personel</p>
                <p className="font-semibold text-lg">{request.personnel_full_name || 'Bilinmiyor'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Wallet className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Talep Edilen Tutar</p>
                <p className="font-semibold text-lg">{request.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
              </div>
            </div>
          </div>

          <h3 className="font-semibold mb-2 flex items-center gap-2"><History size={18}/>İşlem Geçmişi</h3>
          <div className="space-y-3 bg-black/20 p-4 rounded-lg">
             {request.history_log?.map((log, index) => (
              <div key={index} className="border-l-2 pl-4 border-gray-600">
                <p className="font-semibold">{log.action} <span className="text-sm font-normal text-gray-400">- {log.actor}</span></p>
                {/* DÜZELTME: Tırnak işaretleri hatasını gidermek için template literal kullanıldı */}
                <p className="text-sm text-gray-300 italic">{`"${log.notes}"`}</p>
                <p className="text-xs text-gray-500 mt-1">{safeNewDate(log.timestamp).toLocaleString('tr-TR')}</p>
               </div>
             ))}
          </div>
          
          {canTakeAction && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <h3 className="font-semibold mb-2">İşlem Yap</h3>
               <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="İşlem notunuzu buraya yazabilirsiniz..."
                className="w-full bg-black/20 p-2 rounded-lg border border-white/10"
                rows={3}
               />
              <div className="flex justify-end gap-4 mt-4">
                <button onClick={() => handleAction('reject')} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg">
                  <Trash2 size={16} /> {rejectText}
                </button>
                <button onClick={() => handleAction('approve')} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-600 rounded-lg">
                   <Check size={16} /> {approveText}
                </button>
              </div>
            </div>
          )}
         </div>
      </div>
    </div>
  );
}