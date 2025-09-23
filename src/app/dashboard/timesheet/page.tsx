// YOL: src/app/dashboard/timesheet/page.tsx

"use client";

import { useEffect, useState, useCallback, useMemo, MouseEvent } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { ChevronLeft, ChevronRight, Filter, Search, X, FileDown, Save, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from '@/components/GlassCard';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { getOvertimeReport, saveTimesheetExtras } from '@/app/actions';
import type { Personnel } from '@/types/index';

const statusStyles = {
    'çalıştı': { fullName: 'Çalışılan Gün', abbr: 'X', count_as_work_day: 1 },
    'yıllık izin': { fullName: 'Yıllık İzin', abbr: 'Yİ', count_as_work_day: 1 },
    'ücretli izin': { fullName: 'Ücretli İzin', abbr: 'Üİ', count_as_work_day: 1 },
    'ücretsiz izin': { fullName: 'Ücretsiz İzin', abbr: 'ÜZİ', count_as_work_day: 0 },
    'raporlu': { fullName: 'Raporlu', abbr: 'R', count_as_work_day: 1 },
    'resmi tatil': { fullName: 'Resmi Tatil', abbr: 'RT', count_as_work_day: 0 },
    'hafta sonu': { fullName: 'Hafta Tatili', abbr: 'H', count_as_work_day: 0 },
};

type LeaveStatus = keyof typeof statusStyles;
type ApprovedLeave = {
    personnel_id: number;
    start_date: string;
    end_date: string;
    leave_type: string;
};
type TimesheetData = {
    personnel_id: number;
    full_name: string;
    tc_kimlik_no: string;
    ise_giris_tarihi: string | null;
    daily_statuses: { [day: number]: LeaveStatus };
    summary: { [key: string]: number | string };
    missing_days: number | null;
    additional_pay: number | null;
    notes: string | null;
};
type PersonnelData = Pick<Personnel, 'id' | 'ADI SOYADI' | 'TC. KİMLİK NUMARASI' | 'KIDEM TARİHİ'>;

type Region = { id: number; name: string; };
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

const secondsToTimeString = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return "00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export default function TimesheetPage() {
    const { supabase, profile, weekendConfiguration } = useSettings();
    const [initialData, setInitialData] = useState<TimesheetData[]>([]);
    const [editedData, setEditedData] = useState<TimesheetData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
    const monthDays = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

    const clearFilters = () => {
        setSelectedRegion('');
        setSearchQuery('');
    };

    useEffect(() => {
        const fetchRegions = async () => {
            const { data, error } = await supabase.from('regions').select('id, name');
            if (error) toast.error("Bölgeler yüklenemedi.");
            else setRegions(data as Region[]);
        };
        fetchRegions();
    }, [supabase]);

    const fetchTimesheet = useCallback(async (date: Date, regionId: string, search: string) => {
        if (!profile) return;
        setLoading(true);

        const year = date.getFullYear();
        const month = date.getMonth();
        const monthStartDate = new Date(Date.UTC(year, month, 1)).toISOString().split('T')[0];
        const monthEndDate = new Date(Date.UTC(year, month + 1, 0)).toISOString().split('T')[0];

        try {
            let personnelQuery = supabase.from('personnel').select('id, "ADI SOYADI", "TC. KİMLİK NUMARASI", "KIDEM TARİHİ", regions(id, name)');
            if (profile.role === 'coordinator' && profile.region_id) personnelQuery = personnelQuery.eq('"ŞUBE"', profile.region_id);
            if (regionId) personnelQuery = personnelQuery.eq('"ŞUBE"', Number(regionId));
            if (search) personnelQuery = personnelQuery.ilike('"ADI SOYADI"', `%${search}%`);
        
            const { data: personnelData, error: personnelError } = await personnelQuery.order('"ADI SOYADI"');
            if (personnelError) throw personnelError;

            if (!personnelData || personnelData.length === 0) {
                setInitialData([]);
                setEditedData([]);
                setLoading(false);
                return;
            }

            const personnelIds = personnelData.map(p => p.id);
            const currentRegion = regions.find(r => r.id.toString() === (regionId || profile.region_id?.toString()));
            
            const [leavesRes, holidaysRes, overtimeRes, extrasRes] = await Promise.all([
                supabase.from('leave_requests').select('*').in('personnel_id', personnelIds).eq('status', 'approved'),
                supabase.from('official_holidays').select('date').gte('date', monthStartDate).lte('date', monthEndDate),
                currentRegion ? getOvertimeReport(currentRegion.name, monthStartDate, monthEndDate) : Promise.resolve({ success: false, data: [] }),
                supabase.from('timesheet_extras').select('*').in('personnel_id', personnelIds).eq('year', year).eq('month', month + 1)
            ]);

            if (leavesRes.error || holidaysRes.error || extrasRes.error) throw new Error("Veri çekme hatası");

            const localHolidays = new Set(holidaysRes.data.map(h => h.date));
            
            const overtimeMap = new Map<string, number>();
            if (overtimeRes.success && overtimeRes.data) {
                overtimeRes.data.forEach(rec => {
                    const currentTotal = overtimeMap.get(rec.userName) || 0;
                    overtimeMap.set(rec.userName, currentTotal + rec.totalOvertimeSeconds);
                });
            }

            const extrasMap = new Map(extrasRes.data.map(e => [e.personnel_id, e]));

            const getDayStatus = (day: number, leaves: ApprovedLeave[]): LeaveStatus => {
                const dateForDay = new Date(Date.UTC(year, month, day));
                const isoDate = dateForDay.toISOString().split('T')[0];
                const dayOfWeek = dateForDay.getUTCDay();

                if (weekendConfiguration === 'saturday_sunday' && (dayOfWeek === 0 || dayOfWeek === 6)) return 'hafta sonu';
                if (weekendConfiguration === 'sunday_only' && dayOfWeek === 0) return 'hafta sonu';
                if (localHolidays.has(isoDate)) return 'resmi tatil';

                for (const leave of leaves) {
                    if (isoDate >= leave.start_date && isoDate <= leave.end_date) {
                        const cleanLeaveType = leave.leave_type?.trim().toLowerCase() as LeaveStatus;
                        return statusStyles[cleanLeaveType] ? cleanLeaveType : 'çalıştı';
                    }
                }
                return 'çalıştı';
            };
            
            const finalData = personnelData.map((person: PersonnelData) => {
                const personLeaves = (leavesRes.data as ApprovedLeave[]).filter(l => l.personnel_id === person.id);
                const daily_statuses: { [day: number]: LeaveStatus } = {};
                monthDays.forEach(day => {
                    daily_statuses[day] = getDayStatus(day, personLeaves);
                });
                
                // DÜZELTME: Sayım için ayrı bir nesne kullanıldı, böylece string ve number tipleri karışmadı.
                const summaryCounts: { [key: string]: number } = {};
                let fiili_gun = 0;
                Object.values(daily_statuses).forEach(status => {
                    summaryCounts[status] = (summaryCounts[status] || 0) + 1;
                    if (statusStyles[status].count_as_work_day === 1) {
                        fiili_gun += 1;
                    }
                });
                
                const toplam_gun = fiili_gun + (summaryCounts['hafta sonu'] || 0) + (summaryCounts['resmi tatil'] || 0);
                const personExtras = extrasMap.get(person.id);

                return {
                    personnel_id: person.id,
                    full_name: person["ADI SOYADI"],
                    tc_kimlik_no: person["TC. KİMLİK NUMARASI"],
                    ise_giris_tarihi: person["KIDEM TARİHİ"],
                    daily_statuses,
                    summary: {
                        "FİİLİ GÜN": fiili_gun,
                        "HAFTA TATİLİ": summaryCounts['hafta sonu'] || 0,
                        "RESMİ TATİL": summaryCounts['resmi tatil'] || 0,
                        "ÜCRETLİ İZİN": summaryCounts['ücretli izin'] || 0,
                        "RAPOR": summaryCounts['raporlu'] || 0,
                        "ÜCRETSİZ İZİN": summaryCounts['ücretsiz izin'] || 0,
                        "TOPLAM GÜN": toplam_gun,
                        "FAZLA MESAİ SAATİ": secondsToTimeString(overtimeMap.get(person["ADI SOYADI"]) || 0),
                    },
                    missing_days: personExtras?.missing_days ?? null,
                    additional_pay: personExtras?.additional_pay ?? null,
                    notes: personExtras?.notes ?? null,
                };
            });
            setInitialData(finalData as TimesheetData[]);
            setEditedData(JSON.parse(JSON.stringify(finalData)));
        } catch (error) {
            toast.error("Puantaj verileri çekilemedi.");
            console.error("Puantaj Hatası:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, profile, regions, weekendConfiguration, monthDays]);

    useEffect(() => {
        if (regions.length > 0 || profile?.role === 'coordinator') {
            const timer = setTimeout(() => {
                fetchTimesheet(currentDate, selectedRegion, searchQuery);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [currentDate, selectedRegion, searchQuery, fetchTimesheet, regions, profile]);

    const handleManualDataChange = (personnelId: number, field: 'missing_days' | 'additional_pay' | 'notes', value: string | number | null) => {
        setEditedData(prev => prev.map(p => {
            if (p.personnel_id === personnelId) {
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const changesToSave: {
            personnel_id: number;
            year: number;
            month: number;
            missing_days: number | null;
            additional_pay: number | null;
            notes: string | null;
        }[] = editedData
            .filter((p: TimesheetData, index: number) => 
                p.missing_days !== initialData[index].missing_days ||
                p.additional_pay !== initialData[index].additional_pay ||
                p.notes !== initialData[index].notes
            )
            .map((p: TimesheetData) => ({
                personnel_id: p.personnel_id,
                year: year,
                month: month,
                missing_days: p.missing_days,
                additional_pay: p.additional_pay,
                notes: p.notes,
            }));

        if (changesToSave.length === 0) {
            toast.success("Kaydedilecek bir değişiklik yok.");
            setIsSaving(false);
            return;
        }

        const result = await saveTimesheetExtras(changesToSave);
        if (result.success) {
            toast.success(result.message);
            fetchTimesheet(currentDate, selectedRegion, searchQuery);
        } else {
            toast.error(result.message);
        }
        setIsSaving(false);
    };

    const handleExportToExcel = async () => {
        if (editedData.length === 0) {
            toast.error("Aktarılacak veri bulunmuyor.");
            return;
        }
        setIsExporting(true);
        const toastId = toast.loading("Excel raporu oluşturuluyor...");
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Puantaj Cetveli');

            worksheet.mergeCells('A1:AR1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'Şirket: Ay-ka Doğalgaz Enerji';
            titleCell.font = { bold: true, size: 14 };
            titleCell.alignment = { horizontal: 'center' };

            worksheet.mergeCells('A2:AR2');
            const subtitleCell = worksheet.getCell('A2');
            const monthName = currentDate.toLocaleDateString('tr-TR', { month: 'long' }).toUpperCase();
            subtitleCell.value = `${monthName} ${year} DÖNEMİ PUANTAJ LİSTESİ`;
            subtitleCell.font = { bold: true, size: 12 };
            subtitleCell.alignment = { horizontal: 'center' };
            worksheet.addRow([]);

            const baseHeaders = ['SIRA NO', 'PER. T.C. NO', 'ADI SOYADI', 'İŞE GİRİŞ TARİHİ'];
            const summaryHeadersExcel = [
                'İŞTEN AYRILIŞ TARİHİ', 'GÜNLÜK MESAİ SAATİ', 'TOPLAM MESAİ SÜRESİ', 'HAFTA TATİLİ', 'RESMİ TATİL', 
                'YOL YARDIMI', 'FAZLA MESAİ GEÇEN AY', 'FAZLA MESAİ BU AY', 'TOPLAM FAZLA MESAİ', 'İKRAMİYE', 'AVANS', 'NET ELE GEÇECEK'
            ];
            const dayHeaders = monthDays.map(day => {
                const date = new Date(year, month, day);
                const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' });
                return `${day}\n${dayName}`;
            });
            const headerRow = worksheet.addRow([...baseHeaders, ...summaryHeadersExcel, ...dayHeaders]);
            headerRow.font = { bold: true };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            
            editedData.forEach((person, index) => {
                const dayStatuses = monthDays.map(day => person.daily_statuses[day] ? statusStyles[person.daily_statuses[day]].abbr : '');
                const rowData = [
                    index + 1,
                    person.tc_kimlik_no,
                    person.full_name,
                    person.ise_giris_tarihi ? new Date(person.ise_giris_tarihi) : '',
                    ...Array(summaryHeadersExcel.length).fill(''),
                    ...dayStatuses
                ];
                worksheet.addRow(rowData);
            });

            worksheet.addRow([]);
            worksheet.mergeCells(`A${worksheet.rowCount}:B${worksheet.rowCount}`);
            worksheet.getCell(`A${worksheet.rowCount}`).value = "AÇIKLAMA";
            worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true };

            Object.values(statusStyles).forEach(style => {
                const legendRow = worksheet.addRow([style.abbr, style.fullName]);
                worksheet.mergeCells(`B${legendRow.number}:C${legendRow.number}`);
            });
            
            worksheet.getColumn(1).width = 5;
            worksheet.getColumn(2).width = 15;
            worksheet.getColumn(3).width = 25;
            worksheet.getColumn(4).width = 15;
            worksheet.getColumn(4).numFmt = 'dd.mm.yyyy';

            for (let i = 0; i < daysInMonth; i++) {
                worksheet.getColumn(baseHeaders.length + summaryHeadersExcel.length + 1 + i).width = 5;
                worksheet.getColumn(baseHeaders.length + summaryHeadersExcel.length + 1 + i).alignment = { horizontal: 'center' };
            }

            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Puantaj_${monthName}_${year}.xlsx`);
            toast.success("Rapor başarıyla oluşturuldu!", { id: toastId });

        } catch (error) {
            console.error("Excel oluşturma hatası:", error);
            toast.error("Rapor oluşturulurken bir hata oluştu.", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };
    
    const summaryHeadersUI = ["FİİLİ GÜN", "HAFTA TATİLİ", "RESMİ TATİL", "ÜCRETLİ İZİN", "RAPOR", "ÜCRETSİZ İZİN", "TOPLAM GÜN", "EKSİK GÜN", "FAZLA MESAİ SAATİ", "İLAVE ÜCRET", "AÇIKLAMA"];
    const isDirty = JSON.stringify(initialData) !== JSON.stringify(editedData);
    
    const visibleStatuses = useMemo(() => {
        const statuses = new Set<LeaveStatus>();
        editedData.forEach(person => {
            Object.values(person.daily_statuses).forEach(status => {
                statuses.add(status);
            });
        });
        return Array.from(statuses).map(statusKey => ({
            key: statusKey,
            ...statusStyles[statusKey]
        })).sort((a,b) => a.fullName.localeCompare(b.fullName));
    }, [editedData]);

    return (
        <>
            {isLegendOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsLegendOpen(false)}>
                    {/* DÜZELTME: onClick prop'u GlassCard'dan alınıp sarmalayıcı bir div'e verildi ve event tipi eklendi */}
                    <div onClick={(e: MouseEvent) => e.stopPropagation()}>
                        <GlassCard className="w-full max-w-md">
                            <h3 className="text-xl font-bold mb-4">Lejant (Açıklamalar)</h3>
                            <div className="space-y-2">
                                {visibleStatuses.map(status => (
                                    <div key={status.key} className="flex items-center gap-4 text-sm">
                                        <span className="font-bold text-center w-8">{status.abbr}</span>
                                        <span>-</span>
                                        <span>{status.fullName}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}

            <div className="p-4 md:p-8 text-white h-full flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h1 className="text-3xl font-bold">Puantaj Cetveli</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsLegendOpen(true)} className="flex items-center gap-2 bg-gray-600/50 px-3 py-2 rounded-lg hover:bg-gray-500/50 transition-colors" title="Lejantı Görüntüle">
                           <HelpCircle size={16} /> <span className="hidden sm:inline">Lejant</span>
                        </button>
                        <button onClick={handleExportToExcel} disabled={isExporting || loading || editedData.length === 0} className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                            <FileDown size={16} />
                            <span>{isExporting ? 'Aktarılıyor...' : "Excel'e Aktar"}</span>
                        </button>
                        {isDirty && (
                             <button onClick={handleSaveChanges} disabled={isSaving} className="btn-save-animated">
  <div className="svg-wrapper-1">
    <div className="svg-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" className="icon">
        <path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7.5L16.5 3H15zm-3 13a3 3 0 11-6 0 3 3 0 016 0zM6 4h7v4H6V4z"></path>
      </svg>
    </div>
  </div>
  <span>{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</span>
</button>
                        )}
                        <div className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg">
                            <select value={year} onChange={(e) => setCurrentDate(new Date(Number(e.target.value), month, 1))} className="bg-transparent text-xl font-semibold border-none focus:ring-0">
                                {years.map(y => (<option key={y} value={y}>{y}</option>))}
                            </select>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentDate(prev => new Date(prev.setMonth(prev.getMonth() - 1)))} className="p-2 rounded-md hover:bg-white/10"><ChevronLeft /></button>
                                <span className="text-xl font-semibold w-36 text-center">{currentDate.toLocaleDateString('tr-TR', { month: 'long' })}</span>
                                <button onClick={() => setCurrentDate(prev => new Date(prev.setMonth(prev.getMonth() + 1)))} className="p-2 rounded-md hover:bg-white/10"><ChevronRight /></button>
                            </div>
                        </div>
                    </div>
                </div>

                <GlassCard className="mb-6 !p-4">
                     <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-lg font-semibold"><Filter size={20} /><h3>Filtreler</h3></div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <div className="relative w-full sm:w-auto">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Personel ara..." className="w-full sm:w-64 bg-black/20 py-2 pl-10 pr-4 rounded-lg border border-white/10" />
                            </div>
                            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full sm:w-auto bg-black/20 py-2 px-4 rounded-lg border border-white/10">
                                <option value="">Tüm Bölgeler</option>
                                {regions.map(region => (<option key={region.id} value={region.id}>{region.name}</option>))}
                            </select>
                            {(selectedRegion || searchQuery) && (<button onClick={clearFilters} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"><X size={16}/> Temizle</button>)}
                        </div>
                    </div>
                </GlassCard>
                
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-auto">
                        {loading ? <div className="text-center p-10">Yükleniyor...</div> : (
                            <table className="w-full border-collapse text-xs">
                                <thead className="sticky top-0 bg-gray-800 z-10">
                                     <tr>
                                        <th className="sticky left-0 bg-gray-800 p-2 border-r border-b border-gray-700 min-w-[50px]">SIRA NO</th>
                                        <th className="sticky left-[50px] bg-gray-800 p-2 border-r border-b border-gray-700 min-w-[200px]">ADI SOYADI</th>
                                        {monthDays.map(day => (<th key={day} className="p-2 border-r border-b border-gray-700 text-center min-w-[40px]">{day}</th>))}
                                        {summaryHeadersUI.map(header => (
                                            <th key={header} className="p-2 border-r border-b border-gray-700 text-center min-w-[100px] bg-gray-700/50 whitespace-nowrap">{header}</th>
                                        ))}
                                     </tr>
                                </thead>
                                <tbody>
                                     {editedData.map((person, index) => (
                                        <tr key={person.personnel_id} className="hover:bg-white/5">
                                            <td className="sticky left-0 bg-gray-800/80 backdrop-blur-sm p-2 border-r border-b border-gray-700 font-semibold text-center">{index + 1}</td>
                                            <td className="sticky left-[50px] bg-gray-800/80 backdrop-blur-sm p-2 border-r border-b border-gray-700 font-semibold whitespace-nowrap">{person.full_name}</td>
                                            {monthDays.map(day => {
                                                const status = person.daily_statuses[day];
                                                const style = statusStyles[status] || { abbr: '?' };
                                                return <td key={day} title={statusStyles[status]?.fullName} className={`p-2 border-r border-b border-gray-700 text-center font-bold`}>{style.abbr}</td>;
                                            })}
                                            {summaryHeadersUI.map(header => {
                                                if (header === "EKSİK GÜN" || header === "İLAVE ÜCRET" || header === "AÇIKLAMA") {
                                                    const fieldName = { "EKSİK GÜN": "missing_days", "İLAVE ÜCRET": "additional_pay", "AÇIKLAMA": "notes"}[header] as 'missing_days' | 'additional_pay' | 'notes';
                                                    return (
                                                        <td key={header} className="p-0 border-r border-b border-gray-700 text-center bg-gray-900">
                                                            <input 
                                                                type={fieldName === 'notes' ? 'text' : 'number'}
                                                                value={person[fieldName] ?? ''}
                                                                onChange={(e) => handleManualDataChange(person.personnel_id, fieldName, e.target.value === '' ? null : (fieldName === 'notes' ? e.target.value : parseFloat(e.target.value)))}
                                                                className="w-full h-full bg-transparent p-2 text-center text-white outline-none focus:bg-sky-900/50"
                                                            />
                                                        </td>
                                                    );
                                                }
                                                return <td key={header} className="p-2 border-r border-b border-gray-700 text-center font-semibold">{person.summary[header]}</td>;
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}