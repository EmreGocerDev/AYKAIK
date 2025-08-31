"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';
import toast from 'react-hot-toast';
import RequestDetailsModal from '@/components/RequestDetailsModal';
import type { LeaveRequest } from '../requests/page';
import { User as UserIcon } from 'lucide-react';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';

type CalendarEvent = {
  title: string;
  start: string;
  end?: string;
  display?: string;
  backgroundColor: string;
  borderColor: string;
  textColor?: string;
  allDay: boolean;
  extendedProps: {
    isHoliday?: boolean;
    originalRequest?: LeaveRequest;
  }
};
type Personnel = {
  id: number;
  full_name: string;
};
export default function CalendarPage() {
  const { supabase } = useSettings();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>('');

  useEffect(() => {
    const fetchPersonnel = async () => {
      // DÜZELTME: Kullanılmayan error değişkeni kaldırıldı.
      const { data } = await supabase
        .from('personnel')
        .select('id, full_name')
        .order('full_name');
      if (data) setPersonnelList(data);
    };
    fetchPersonnel();
  }, [supabase]);

  const fetchCalendarData = useCallback(async (personnelId: string) => {
    setLoading(true);

    const [requestsRes, holidaysRes] = await Promise.all([
      supabase.rpc('search_leave_requests', {
        personnel_filter_id: personnelId ? Number(personnelId) : null,
        region_filter_id: null,
        search_query: null,
        limit_val: 10000,
        offset_val: 0
      }),
      supabase.from('official_holidays').select('name, date')
    ]);

    if (requestsRes.error || holidaysRes.error) {
      console.error("Takvim verileri çekilirken hata:", requestsRes.error || holidaysRes.error);
      toast.error("Takvim verileri yüklenemedi.");
      setLoading(false);
      return;
    }
    
    if (personnelId) {
      const leaveEvents: CalendarEvent[] = (requestsRes.data as LeaveRequest[]).map(req => ({
        title: req.personnel_full_name,
        start: req.start_date,
        end: new Date(new Date(req.end_date.replace(/-/g, '/')).setDate(new Date(req.end_date.replace(/-/g, '/')).getDate() + 1)).toISOString().split('T')[0],
        display: 'background',
        backgroundColor: 'rgba(239, 68, 68, 0.4)',
        borderColor: 'transparent',
        allDay: true,
        extendedProps: {
          originalRequest: req,
        }
      }));
      setEvents(leaveEvents);
    } else {
        const leaveEvents: CalendarEvent[] = (requestsRes.data as LeaveRequest[]).map(req => ({
            title: req.personnel_full_name || 'Bilinmeyen',
            start: req.start_date,
            end: new Date(new Date(req.end_date).setDate(new Date(req.end_date).getDate() + 1)).toISOString().split('T')[0],
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            textColor: '#cbd5e1',
            allDay: true,
            extendedProps: {
              originalRequest: req,
            }
        }));
        const holidayEvents: CalendarEvent[] = holidaysRes.data.map(holiday => ({
          title: holiday.name,
          start: holiday.date,
          allDay: true,
          backgroundColor: '#6366f1',
          borderColor: '#6366f1',
          extendedProps: { isHoliday: true }
        }));
        setEvents([...leaveEvents, ...holidayEvents]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCalendarData(selectedPersonnelId);
  }, [selectedPersonnelId, fetchCalendarData]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (clickInfo.event.extendedProps.originalRequest) {
      setSelectedRequest(clickInfo.event.extendedProps.originalRequest as LeaveRequest);
    }
  };
  
  const handleModalClose = () => {
    setSelectedRequest(null);
    fetchCalendarData(selectedPersonnelId);
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    return (
      <div className='w-full overflow-hidden whitespace-nowrap text-ellipsis'>
        <UserIcon size={12} className="inline-block mr-1" />
        {eventInfo.event.title}
      </div>
    );
  };

  return (
    <>
      <div className="p-4 md:p-8 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Genel Takvim</h1>
            <div className='w-full md:w-auto'>
              <select
                value={selectedPersonnelId}
                onChange={(e) => setSelectedPersonnelId(e.target.value)}
                className="w-full md:w-72 bg-black/20 py-2 px-4 rounded-lg border border-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Tüm Personelleri Göster</option>
                {personnelList.map(person => (
                  <option key={person.id} value={person.id}>{person.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="p-4 bg-gray-800/50 backdrop-blur-md border border-white/10 rounded-xl">
            {loading ? (
              <div className="text-center py-20">Takvim yükleniyor...</div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,dayGridWeek'
                }}
                events={events}
                locale={trLocale}
                firstDay={1}
                height="auto"
                eventClick={handleEventClick}
                dayMaxEvents={2}
                eventContent={selectedPersonnelId ? undefined : renderEventContent}
              />
            )}
          </div>
        </div>
      </div>

      {selectedRequest && (
        <RequestDetailsModal 
          request={selectedRequest} 
          onClose={handleModalClose} 
        />
      )}
    </>
  );
}