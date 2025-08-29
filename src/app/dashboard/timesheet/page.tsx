"use client";

import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { ChevronLeft, ChevronRight, Filter, Search, X, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from '@/components/GlassCard';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';    

const statusStyles = {
    'çalıştı': { fullName: 'Çalıştı', abbr: 'Ç', className: 'bg-green-500/20 text-green-300' },
    'yıllık izin': { fullName: 'Yıllık İzin', abbr: 'Yİ', className: 'bg-blue-500/20 text-blue-300' },
    'ücretli izin': { fullName: 'Ücretli İzin', abbr: 'Üİ', className: 'bg-cyan-500/20 text-cyan-300' },
    'ücretsiz izin': { fullName: 'Ücretsiz İzin', abbr: 'ÜZİ', className: 'bg-gray-500/20 text-gray-300' },
    'raporlu': { fullName: 'Raporlu', abbr: 'R', className: 'bg-orange-500/20 text-orange-300' },
    'resmi tatil': { fullName: 'Resmi Tatil', abbr: 'RT', className: 'bg-indigo-500/20 text-indigo-300' },
    'hafta sonu': { fullName: 'Hafta Sonu', abbr: 'H', className: 'bg-gray-700/20 text-gray-500' },
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
    regions: { name: string } | null;
    approved_leaves: ApprovedLeave[];
};

type Region = { id: number; name: string; };
type SummaryCounts = { [key in LeaveStatus]?: number };

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

export default function TimesheetPage() {
    const { supabase, tintValue, blurPx, borderRadiusPx, grainOpacity, profile, weekendConfiguration } = useSettings();
    const [timesheetData, setTimesheetData] = useState<TimesheetData[]>([]);
    const [holidays, setHolidays] = useState<Set<string>>(new Set());
    const [dailyStatusCache, setDailyStatusCache] = useState<Map<string, LeaveStatus>>(new Map());
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showWholeYear, setShowWholeYear] = useState(false);
    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [expandedPersonnelId, setExpandedPersonnelId] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
    const monthDays = useMemo(() => Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => i + 1), [currentDate]);

    useEffect(() => {
        const fetchRegions = async () => {
            const { data, error } = await supabase.from('regions').select('id, name');
            if (error) toast.error("Bölgeler yüklenemedi.");
            else setRegions(data as Region[]);
        };
        fetchRegions();
    }, [supabase]);
const handleYearChange = (year: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setFullYear(year);
        return newDate;
    });
};
const clearFilters = () => {
    setSelectedRegion('');
    setSearchQuery('');
};
    const fetchTimesheet = useCallback(async (date: Date, regionId: string, search: string) => {
        setLoading(true);
        try {
            if (!profile) { setLoading(false); return; }

            let personnelQuery = supabase.from('personnel').select('id, full_name, tc_kimlik_no, regions(name)');
            if (profile.role === 'coordinator') personnelQuery = personnelQuery.eq('region_id', profile.region_id);
            if (regionId) personnelQuery = personnelQuery.eq('region_id', Number(regionId));
            if (search) personnelQuery = personnelQuery.ilike('full_name', `%${search}%`);

            const { data: personnelData, error: personnelError } = await personnelQuery.order('full_name');
            if (personnelError) throw personnelError;

            if (!personnelData || personnelData.length === 0) {
                setTimesheetData([]);
                setHolidays(new Set());
                setLoading(false);
                return;
            }

            const personnelIds = personnelData.map(p => p.id);
            const startDate = new Date(date.getFullYear(), 0, 1);
            const endDate = new Date(date.getFullYear(), 11, 31);

            const [leavesRes, holidaysRes] = await Promise.all([
                supabase.from('leave_requests').select('personnel_id, start_date, end_date, leave_type').in('personnel_id', personnelIds).eq('status', 'approved'),
                supabase.from('official_holidays').select('date').gte('date', startDate.toISOString()).lte('date', endDate.toISOString())
            ]);
            
            if (leavesRes.error) throw leavesRes.error;
            if (holidaysRes.error) throw holidaysRes.error;
            
            setHolidays(new Set(holidaysRes.data.map(h => h.date)));
            
            const combinedData = personnelData.map(person => {
    // Supabase'in [ { name: '...' } ] olarak gönderdiği diziyi { name: '...' } objesine çeviriyoruz.
    const regionObject = Array.isArray(person.regions) ? person.regions[0] : person.regions;

    return {
        ...person,
        personnel_id: person.id,
        regions: regionObject || null, // Tek bir obje veya null olarak ayarla
        approved_leaves: leavesRes.data.filter(l => l.personnel_id === person.id),
    };
});
// TypeScript'i ikna etmek için 'unknown' üzerinden bir cast yapıyoruz.
setTimesheetData(combinedData as unknown as TimesheetData[]);
            setDailyStatusCache(new Map());
        } catch (error: any) {
            toast.error("Puantaj verileri çekilemedi.");
            console.error("Puantaj Hatası:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, profile]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTimesheet(currentDate, selectedRegion, searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentDate, selectedRegion, searchQuery, fetchTimesheet]);

    const getDayStatus = useCallback((person: TimesheetData, year: number, month: number, day: number): LeaveStatus => {
        const cacheKey = `${person.personnel_id}-${year}-${month}-${day}`;
        if (dailyStatusCache.has(cacheKey)) {
            return dailyStatusCache.get(cacheKey)!;
        }
        const dateForDay = new Date(Date.UTC(year, month, day));
        const isoDate = dateForDay.toISOString().split('T')[0];
        const dayOfWeek = dateForDay.getUTCDay();

        if (weekendConfiguration === 'saturday_sunday' && (dayOfWeek === 0 || dayOfWeek === 6)) {
            dailyStatusCache.set(cacheKey, 'hafta sonu'); return 'hafta sonu';
        }
        if (weekendConfiguration === 'sunday_only' && dayOfWeek === 0) {
            dailyStatusCache.set(cacheKey, 'hafta sonu'); return 'hafta sonu';
        }
        if (holidays.has(isoDate)) {
            dailyStatusCache.set(cacheKey, 'resmi tatil'); return 'resmi tatil';
        }
        for (const leave of person.approved_leaves) {
            if (isoDate >= leave.start_date && isoDate <= leave.end_date) {
                const cleanLeaveType = leave.leave_type?.trim().toLowerCase() as LeaveStatus;
                if (statusStyles[cleanLeaveType]) {
                    dailyStatusCache.set(cacheKey, cleanLeaveType); return cleanLeaveType;
                }
            }
        }
        dailyStatusCache.set(cacheKey, 'çalıştı'); return 'çalıştı';
    }, [dailyStatusCache, holidays, weekendConfiguration]);

    const calculateSummary = useCallback((person: TimesheetData): SummaryCounts => {
        const counts: SummaryCounts = {};
        const year = currentDate.getFullYear();
        
        const processDay = (month: number, day: number) => {
            const status = getDayStatus(person, year, month, day);
            counts[status] = (counts[status] || 0) + 1;
        };

        if (showWholeYear) {
            months.forEach(month => {
                const daysInMonth = getDaysInMonth(year, month);
                for (let day = 1; day <= daysInMonth; day++) processDay(month, day);
            });
        } else {
            const month = currentDate.getMonth();
            const daysInMonth = getDaysInMonth(year, month);
            for (let day = 1; day <= daysInMonth; day++) processDay(month, day);
        }
        return counts;
    }, [currentDate, getDayStatus, showWholeYear, months]);
    
    // YENİ: Sütunları içeriğe göre otomatik boyutlandıran yardımcı fonksiyon
    

    // YENİ: Otomatik sütun boyutlandırma eklenmiş ve geliştirilmiş export fonksiyonu
  
    // YENİ: ExcelJS kullanarak stil (renk, boyut) özellikli tam rapor oluşturan fonksiyon
    const handleExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading("Renkli Excel raporu oluşturuluyor...");

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Puantaj Raporu');

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // Başlık Stil Tanımlamaları
            const headerStyle = {
                font: { bold: true, color: { argb: 'FFFFFFFF' } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } } as ExcelJS.Fill,
                alignment: { horizontal: 'center', vertical: 'middle' } as ExcelJS.Alignment,
            };

            const cellStyle = (status: LeaveStatus) => {
                const colors: { [key: string]: { textColor: string, bgColor: string } } = {
                    'çalıştı': { textColor: 'FF68D391', bgColor: 'FF2F5242' },
                    'yıllık izin': { textColor: 'FF63B3ED', bgColor: 'FF2C5282' },
                    'ücretli izin': { textColor: 'FF4FD1C5', bgColor: 'FF285E61' },
                    'ücretsiz izin': { textColor: 'FFA0AEC0', bgColor: 'FF4A5568' },
                    'raporlu': { textColor: 'FFF6AD55', bgColor: 'FF744210' },
                    'resmi tatil': { textColor: 'FF9F7AEA', bgColor: 'FF553C9A' },
                    'hafta sonu': { textColor: 'FF718096', bgColor: 'FF2D3748' },
                };
                const color = colors[status] || { textColor: 'FFFFFFFF', bgColor: 'FF000000' };
                return {
                    font: { color: { argb: color.textColor } },
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: color.bgColor } } as ExcelJS.Fill,
                    alignment: { horizontal: 'center', vertical: 'middle' } as ExcelJS.Alignment,
                }
            };

            // Sütun Başlıklarını Oluştur
            const headers = [
                { header: 'Personel Adı', key: 'name', width: 30 },
                { header: 'T.C. Kimlik No', key: 'tc', width: 15 },
                { header: 'Bölge', key: 'region', width: 20 },
            ];

            const daysInPeriod = showWholeYear 
                ? months.flatMap(m => Array.from({ length: getDaysInMonth(year, m) }, (_, d) => ({ month: m, day: d + 1 })))
                : Array.from({ length: getDaysInMonth(year, month) }, (_, d) => ({ month: month, day: d + 1 }));

            daysInPeriod.forEach(d => {
                const headerText = showWholeYear ? `${d.day}.${d.month + 1}` : `${d.day}`;
                headers.push({ header: headerText, key: `day_${d.month}_${d.day}`, width: 5 });
            });

            const summaryHeaders = Object.values(statusStyles).map(s => ({
                header: s.fullName, key: s.fullName, width: 15
            }));
            headers.push(...summaryHeaders);
            worksheet.columns = headers;

            // Veri Satırlarını Ekle ve Stillendir
            for (const person of timesheetData) {
                const summary = calculateSummary(person);
                const rowData: any = {
                    name: person.full_name,
                    tc: person.tc_kimlik_no,
                    region: person.regions?.name || 'N/A',
                };
                
                daysInPeriod.forEach(d => {
                    rowData[`day_${d.month}_${d.day}`] = statusStyles[getDayStatus(person, year, d.month, d.day)].abbr;
                });

                summaryHeaders.forEach(h => {
                    const statusKey = Object.keys(statusStyles).find(key => statusStyles[key as LeaveStatus].fullName === h.header) as LeaveStatus;
                    rowData[h.key] = summary[statusKey] || 0;
                });
                
                const row = worksheet.addRow(rowData);

                // Hücreleri stillendir
                daysInPeriod.forEach((d, index) => {
                    const cell = row.getCell(`day_${d.month}_${d.day}`);
                    const status = getDayStatus(person, year, d.month, d.day);
                    cell.style = cellStyle(status);
                });
            }

            // Başlık satırını stillendir
            worksheet.getRow(1).eachCell(cell => {
                cell.style = headerStyle;
            });
            
            // Dosyayı oluştur ve indir
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Puantaj_Raporu_${currentDate.toLocaleDateString('tr-TR', {month: 'long', year: 'numeric'})}.xlsx`);

            toast.success("Rapor başarıyla oluşturuldu!", { id: toastId });

        } catch (error) {
            console.error("Excel oluşturma hatası:", error);
            toast.error("Rapor oluşturulurken bir hata oluştu.", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };
    return (
        <div className="p-4 md:p-8 text-white h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-3xl font-bold">Puantaj Cetveli</h1>
                <div className="flex items-center gap-4">
                    <button onClick={handleExport} disabled={isExporting || loading} className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <FileDown size={16} />
                        <span>{isExporting ? 'Oluşturuluyor...' : 'Excel\'e Aktar'}</span>
                    </button>
                    <div className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg">
                        <select value={currentDate.getFullYear()} onChange={(e) => handleYearChange(Number(e.target.value))} className="bg-transparent text-xl font-semibold border-none focus:ring-0">
                            {years.map(year => (<option key={year} value={year}>{year}</option>))}
                        </select>
                        {!showWholeYear && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentDate(prev => new Date(prev.setMonth(prev.getMonth() - 1)))} className="p-2 rounded-md hover:bg-white/10"><ChevronLeft /></button>
                                <span className="text-xl font-semibold w-36 text-center">{currentDate.toLocaleDateString('tr-TR', { month: 'long' })}</span>
                                <button onClick={() => setCurrentDate(prev => new Date(prev.setMonth(prev.getMonth() + 1)))} className="p-2 rounded-md hover:bg-white/10"><ChevronRight /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <GlassCard {...{tintValue, blurPx, borderRadiusPx, grainOpacity}} className="mb-6 !p-4">
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
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="showYear" checked={showWholeYear} onChange={(e) => setShowWholeYear(e.target.checked)} className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"/>
                        <label htmlFor="showYear" className="text-sm font-medium">Tüm Yılı Göster</label>
                    </div>
                </div>
            </GlassCard>
            
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto">
                    <div className="overflow-x-auto bg-gray-900/50 backdrop-blur-md border border-white/10 rounded-xl">
                        {loading ? <div className="text-center p-10">Yükleniyor...</div> : (
                            <table className="w-full border-collapse">
                                {showWholeYear ? (
                                    <>
                                        <thead className="sticky top-0 bg-gray-800 z-10">
                                            <tr>
                                                <th rowSpan={2} className="sticky left-0 bg-gray-800 p-2 border-r border-b border-gray-700 min-w-[200px]">Personel</th>
                                                {months.map(month => (
                                                    <th key={month} colSpan={getDaysInMonth(currentDate.getFullYear(), month)} className="p-2 border-r border-b border-gray-700 text-center">
                                                        {new Date(currentDate.getFullYear(), month).toLocaleDateString('tr-TR', { month: 'short' })}
                                                    </th>
                                                ))}
                                            </tr>
                                            <tr>
                                                {months.flatMap(month =>
                                                    Array.from({ length: getDaysInMonth(currentDate.getFullYear(), month) }, (_, i) => i + 1).map(day => (
                                                        <th key={`${month}-${day}`} className="p-2 border-r border-b border-gray-700 text-center min-w-[40px] text-xs">{day}</th>
                                                    ))
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {timesheetData.map(person => {
                                                const year = currentDate.getFullYear();
                                                const isExpanded = expandedPersonnelId === person.personnel_id;
                                                const summary = isExpanded ? calculateSummary(person) : null;
                                                return (
                                                <Fragment key={person.personnel_id}>
                                                    <tr className="hover:bg-white/5">
                                                        <td className="sticky left-0 bg-gray-800/80 backdrop-blur-sm p-2 border-r border-b border-gray-700 font-semibold whitespace-nowrap">
                                                            <button onClick={() => setExpandedPersonnelId(isExpanded ? null : person.personnel_id)} className="w-full text-left hover:text-white text-gray-200 transition-colors">
                                                                {person.full_name}
                                                            </button>
                                                        </td>
                                                        {months.flatMap(month =>
                                                            Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1).map(day => {
                                                                const finalStatus = getDayStatus(person, year, month, day);
                                                                const style = statusStyles[finalStatus] || { fullName: 'Hata', abbr: '?', className: 'bg-red-500' };
                                                                return (
                                                                    <td key={`${month}-${day}`} title={style.fullName} className={`p-2 border-r border-b border-gray-700 text-center text-xs font-bold ${style.className}`}>{style.abbr}</td>
                                                                );
                                                            })
                                                        )}
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className="bg-black/20">
                                                            <td colSpan={367} className="p-4">
                                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                                    <div><p className="text-xs text-gray-400">T.C. Kimlik No</p><p className="font-semibold">{person.tc_kimlik_no}</p></div>
                                                                    <div><p className="text-xs text-gray-400">Bölge</p><p className="font-semibold">{person.regions?.name || 'N/A'}</p></div>
                                                                    {Object.entries(summary || {}).map(([key, value]) => (
                                                                        <div key={key}>
                                                                            <p className="text-xs text-gray-400">{statusStyles[key as LeaveStatus].fullName}</p>
                                                                            <p className="font-semibold">{value} gün</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            )})}
                                        </tbody>
                                    </>
                                ) : (
                                    <>
                                        <thead className="sticky top-0 bg-gray-800 z-10">
                                            <tr>
                                                <th className="sticky left-0 bg-gray-800 p-2 border-r border-b border-gray-700 min-w-[200px]">Personel</th>
                                                {monthDays.map(day => (<th key={day} className="p-2 border-r border-b border-gray-700 text-center min-w-[50px]">{day}</th>))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {timesheetData.map((person) => {
                                                const year = currentDate.getFullYear();
                                                const month = currentDate.getMonth();
                                                const isExpanded = expandedPersonnelId === person.personnel_id;
                                                const summary = isExpanded ? calculateSummary(person) : null;
                                                return (
                                                <Fragment key={person.personnel_id}>
                                                    <tr className="hover:bg-white/5">
                                                        <td className="sticky left-0 bg-gray-800/80 backdrop-blur-sm p-2 border-r border-b border-gray-700 font-semibold whitespace-nowrap">
                                                            <button onClick={() => setExpandedPersonnelId(isExpanded ? null : person.personnel_id)} className="w-full text-left hover:text-white text-gray-200 transition-colors">
                                                                {person.full_name}
                                                            </button>
                                                        </td>
                                                        {monthDays.map((day) => {
                                                            const finalStatus = getDayStatus(person, year, month, day);
                                                            const style = statusStyles[finalStatus] || { fullName: 'Hata', abbr: '?', className: 'bg-red-500' };
                                                            return (
                                                                <td key={day} title={style.fullName} className={`p-2 border-r border-b border-gray-700 text-center text-xs font-bold ${style.className}`}>{style.abbr}</td>
                                                            );
                                                        })}
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className="bg-black/20">
                                                            <td colSpan={monthDays.length + 1} className="p-4">
                                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                                    <div><p className="text-xs text-gray-400">T.C. Kimlik No</p><p className="font-semibold">{person.tc_kimlik_no}</p></div>
                                                                    <div><p className="text-xs text-gray-400">Bölge</p><p className="font-semibold">{person.regions?.name || 'N/A'}</p></div>
                                                                    {Object.entries(summary || {}).map(([key, value]) => (
                                                                        <div key={key}>
                                                                            <p className="text-xs text-gray-400">{statusStyles[key as LeaveStatus].fullName}</p>
                                                                            <p className="font-semibold">{value} gün</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            )})}
                                        </tbody>
                                    </>
                                )}
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}