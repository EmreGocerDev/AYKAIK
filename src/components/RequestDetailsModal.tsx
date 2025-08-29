"use client";

import { useState, FormEvent, useEffect } from 'react';
import { X, Check, Trash2, User, Calendar, History, Edit } from 'lucide-react';
import { coordinatorApprove, coordinatorReject, adminApprove, adminReject, updateLeaveRequestDates } from '@/app/actions';
import toast from 'react-hot-toast';
import type { LeaveRequest } from '@/app/dashboard/requests/page';
import { useSettings } from '@/contexts/SettingsContext';
import { calculateWorkingDays } from '@/lib/utils';

type ModalProps = {
  request: LeaveRequest;
  onClose: () => void;
};

export default function RequestDetailsModal({ request, onClose }: ModalProps) {
  const { profile, supabase, weekendConfiguration } = useSettings();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [newStartDate, setNewStartDate] = useState(request.start_date);
  const [newEndDate, setNewEndDate] = useState(request.end_date);
  const [workingDays, setWorkingDays] = useState<number | null>(null);
  
  useEffect(() => {
    const calculateDays = async () => {
      const { data: holidaysData } = await supabase.from('official_holidays').select('date');
      const holidayDates = holidaysData ? holidaysData.map(h => h.date) : [];
      
      const days = calculateWorkingDays(request.start_date, request.end_date, holidayDates, weekendConfiguration);
      setWorkingDays(days);
    };
    calculateDays();
  }, [request.start_date, request.end_date, supabase, weekendConfiguration]);
  
  const handleAction = async (action: 'approve' | 'reject') => {
    setIsSubmitting(true);
    let result;
    if (profile?.role === 'admin') {
      result = action === 'approve' 
        ? await adminApprove(request.id, notes) 
        : await adminReject(request.id, notes);
    } else if (profile?.role === 'coordinator') {
      result = action === 'approve'
        ? await coordinatorApprove(request.id, notes)
        : await coordinatorReject(request.id, notes);
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
  
  const handleUpdateDates = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const originalDates = `${new Date(request.start_date).toLocaleDateString('tr-TR')} - ${new Date(request.end_date).toLocaleDateString('tr-TR')}`;
    formData.append('original_dates', originalDates);
    
    const result = await updateLeaveRequestDates(formData);
    if (result.success) {
      toast.success(result.message);
      setIsEditingDates(false);
      onClose();
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const canEditDates = profile?.role === 'admin' || (profile?.role === 'coordinator' && request.status === 'pending');
  const canCoordinatorAct = profile?.role === 'coordinator' && request.status === 'pending';
  const canAdminAct = profile?.role === 'admin';
  const canTakeAction = canAdminAct || canCoordinatorAct;

  const approveText = profile?.role === 'admin' ? 'Nihai Onay' : 'Koordinatör Onayı';
  const rejectText = profile?.role === 'admin' ? 'Nihai Red' : 'Koordinatör Reddi';
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/80 border border-white/10 p-6 rounded-2xl w-full max-w-2xl text-white max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">İzin Talebi Detayı</h2>
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
            
            <div className="flex items-start gap-3">
              <Calendar className="text-gray-400 mt-1" />
              {isEditingDates ? (
                <form onSubmit={handleUpdateDates} className="w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="date" name="start_date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} className="flex-1 min-w-[130px] bg-black/20 p-2 rounded-lg border border-white/10 [color-scheme:dark]" />
                    <span>-</span>
                    <input type="date" name="end_date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} className="flex-1 min-w-[130px] bg-black/20 p-2 rounded-lg border border-white/10 [color-scheme:dark]" />
                    <div className="flex gap-2">
                      <button type="submit" className="p-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50" disabled={isSubmitting}><Check size={16}/></button>
                      <button type="button" onClick={() => setIsEditingDates(false)} className="p-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50" disabled={isSubmitting}><X size={16}/></button>
                    </div>
                  </div>
                </form>
               ) : (
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm text-gray-400">İzin Tarihleri</p>
                    <div className="flex items-center gap-2 flex-wrap">
                       <p className="font-semibold text-lg">
                        {new Date(request.start_date).toLocaleDateString('tr-TR')} - {new Date(request.end_date).toLocaleDateString('tr-TR')}
                      </p>
                      {workingDays !== null && (
                         <span className="text-sm text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md">
                          {workingDays} iş günü
                        </span>
                      )}
                    </div>
                  </div>
                  {canEditDates && (
                     <button onClick={() => setIsEditingDates(true)} className="p-1 rounded-full hover:bg-white/10 ml-2 self-center"><Edit size={16}/></button>
                   )}
                </div>
              )}
            </div>
          </div>

          <h3 className="font-semibold mb-2 flex items-center gap-2"><History size={18}/>İşlem Geçmişi</h3>
          <div className="space-y-3 bg-black/20 p-4 rounded-lg">
            {request.history_log?.map((log, index) => (
              <div key={index} className="border-l-2 pl-4 border-gray-600">
                <p className="font-semibold">{log.action} <span className="text-sm font-normal text-gray-400">- {log.actor}</span></p>
                <p className="text-sm text-gray-300 italic">&quot;{log.notes}&quot;</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString('tr-TR')}</p>
              </div>
            ))}
          </div>
          
          {canTakeAction && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {request.status !== 'pending' && canAdminAct ? "Mevcut Durumu Değiştir" : "İşlem Yap"}
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="İşlem notunuzu buraya yazabilirsiniz..."
                className="w-full bg-black/20 p-2 rounded-lg border border-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
              />
              <div className="flex justify-end gap-4 mt-4">
                <button 
                  onClick={() => handleAction('reject')}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} /> {rejectText}
                </button>
                 <button 
                  onClick={() => handleAction('approve')}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50"
                >
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