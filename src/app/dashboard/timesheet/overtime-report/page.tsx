"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { getOvertimeReport } from '@/app/actions';
import GlassCard from '@/components/GlassCard';
import toast from 'react-hot-toast';
import { BookUser, Clock, User, ChevronDown, ChevronUp, FileDown } from 'lucide-react';
import type { Region } from '@/types/index';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

type OvertimeRecord = {
    userName: string;
    date: string;
    scheduledStart: string;
    scheduledEnd: string;
    actualStart: string;
    actualEnd: string;
    totalOvertimeSeconds: number;
};

const secondsToTimeString = (totalSeconds: number): string => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export default function OvertimeReportPage() {
    const { supabase, profile, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();

    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedRegionId, setSelectedRegionId] = useState<string>('');
    const [dateRange, setDateRange] = useState({ 
        start: new Date().toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
    });
    const [reportData, setReportData] = useState<OvertimeRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    useEffect(() => {
        const fetchRegionsData = async () => {
            const { data } = await supabase.from('regions').select('id, name').order('name');
            if (data) {
                setRegions(data as Region[]);
                if (profile?.role === 'coordinator' && profile.region_id) {
                    setSelectedRegionId(profile.region_id.toString());
                } else if (data.length > 0) {
                    setSelectedRegionId(data[0].id.toString());
                }
            }
        };
        fetchRegionsData();
    }, [supabase, profile]);

    const handleFetchReport = useCallback(async () => {
        if (!selectedRegionId) {
            toast.error("Lütfen bir bölge seçin.");
            return;
        }
        setLoading(true);
        setReportData([]);
        setExpandedUser(null);
        const selectedRegion = regions.find(r => r.id.toString() === selectedRegionId);
        if (!selectedRegion) return;

        const result = await getOvertimeReport(selectedRegion.name, dateRange.start, dateRange.end);
        if (result.success && result.data) {
            setReportData(result.data);
            if (result.data.length === 0) {
                toast.success("Seçilen aralıkta hiç fazla mesai kaydı bulunamadı.");
            }
        } else {
            toast.error(result.message || "Rapor verileri çekilemedi.");
        }
        setLoading(false);
    }, [selectedRegionId, dateRange, regions]);
    
    const handleToggleUser = (userName: string) => {
        setExpandedUser(prev => (prev === userName ? null : userName));
    };

    const processedData = useMemo(() => {
        const groupedByUser = reportData.reduce((acc, record) => {
            const user = acc.get(record.userName) || { records: [], totalSeconds: 0 };
            user.records.push(record);
            user.totalSeconds += record.totalOvertimeSeconds;
            acc.set(record.userName, user);
            return acc;
        }, new Map<string, { records: OvertimeRecord[], totalSeconds: number }>());

        const grandTotalSeconds = Array.from(groupedByUser.values()).reduce((sum, user) => sum + user.totalSeconds, 0);

        return { groupedByUser, grandTotalSeconds };
    }, [reportData]);
    
    const handleExportToExcel = async () => {
        if (reportData.length === 0) {
            toast.error("Dışa aktarılacak veri bulunmuyor.");
            return;
        }
        setIsExporting(true);
        const toastId = toast.loading("Excel raporu oluşturuluyor...");

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Fazla Mesai Raporu');

            worksheet.columns = [
                { header: 'Personel Adı', key: 'name', width: 30 },
                { header: 'Tarih', key: 'date', width: 15 },
                { header: 'Planlanan Saatler', key: 'scheduled', width: 20 },
                { header: 'Gerçekleşen Saatler', key: 'actual', width: 20 },
                { header: 'Fazla Mesai', key: 'overtime', width: 15, style: { numFmt: '[HH]:mm' } },
            ];
            
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell(cell => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } };
                cell.alignment = { horizontal: 'center' };
            });

            Array.from(processedData.groupedByUser.entries()).sort((a,b) => b[1].totalSeconds - a[1].totalSeconds).forEach(([userName, data]) => {
                const userRow = worksheet.addRow({ name: userName });
                worksheet.mergeCells(`A${userRow.number}:E${userRow.number}`);
                userRow.getCell('name').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' }  };
                userRow.getCell('name').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
                
                data.records.forEach(rec => {
                    worksheet.addRow({
                        date: new Date(rec.date.replace(/-/g, '/')).toLocaleDateString('tr-TR'),
                        scheduled: `${rec.scheduledStart} - ${rec.scheduledEnd}`,
                        actual: `${rec.actualStart} - ${rec.actualEnd}`,
                        overtime: secondsToTimeString(rec.totalOvertimeSeconds)
                    });
                });

                const totalRow = worksheet.addRow({ actual: 'Personel Toplam:', overtime: secondsToTimeString(data.totalSeconds) });
                totalRow.getCell('actual').font = { bold: true };
                totalRow.getCell('overtime').font = { bold: true };
                totalRow.getCell('actual').alignment = { horizontal: 'right' };
                worksheet.addRow({}); // Boş satır ekle
            });

            const grandTotalRow = worksheet.addRow({ actual: 'GENEL TOPLAM:', overtime: secondsToTimeString(processedData.grandTotalSeconds) });
            grandTotalRow.font = { bold: true, size: 16, color: { argb: 'FF63B3ED' } };
            grandTotalRow.getCell('actual').alignment = { horizontal: 'right' };


            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const selectedRegion = regions.find(r => r.id.toString() === selectedRegionId);
            saveAs(blob, `FazlaMesai_${selectedRegion?.name}_${dateRange.start}_${dateRange.end}.xlsx`);

            toast.success("Rapor başarıyla oluşturuldu!", { id: toastId });
        } catch (error) {
            console.error("Excel oluşturma hatası:", error);
            toast.error("Rapor oluşturulurken bir hata oluştu.", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Fazla Mesai Raporu</h1>

                <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }} className="mb-6 !p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                            <label htmlFor="region-select" className="font-semibold">Bölge:</label>
                            <select
                                id="region-select"
                                value={selectedRegionId}
                                onChange={e => setSelectedRegionId(e.target.value)}
                                disabled={profile?.role === 'coordinator' || regions.length === 0}
                                className="bg-black/20 py-2 px-4 rounded-lg border border-white/10"
                            >
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                             <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="bg-black/20 p-2 rounded-lg border border-white/10"/>
                             <span className="font-semibold">/</span>
                             <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="bg-black/20 p-2 rounded-lg border border-white/10"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleFetchReport} disabled={loading || !selectedRegionId} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold w-full sm:w-auto">
                                {loading ? 'Yükleniyor...' : 'Raporu Getir'}
                            </button>
                             <button onClick={handleExportToExcel} disabled={isExporting || reportData.length === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">
                                <FileDown size={16} />
                                <span>{isExporting ? 'Oluşturuluyor...' : "Excel'e Aktar"}</span>
                            </button>
                        </div>
                    </div>
                </GlassCard>

                {loading && <div className="text-center py-10">Rapor oluşturuluyor...</div>}
                
                {!loading && reportData.length > 0 && (
                    <>
                        <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }} className="mb-6">
                             <h2 className="text-xl font-bold mb-4">Aralık Özeti</h2>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="bg-black/20 p-4 rounded-lg">
                                    <Clock className="mx-auto mb-2 text-cyan-400" size={28}/>
                                    <p className="text-3xl font-bold">{secondsToTimeString(processedData.grandTotalSeconds)}</p>
                                    <p className="text-gray-400">Toplam Fazla Mesai</p>
                                </div>
                                <div className="bg-black/20 p-4 rounded-lg">
                                    <User className="mx-auto mb-2 text-cyan-400" size={28}/>
                                    <p className="text-3xl font-bold">{processedData.groupedByUser.size}</p>
                                    <p className="text-gray-400">Personel Sayısı</p>
                                </div>
                                 <div className="bg-black/20 p-4 rounded-lg">
                                    <BookUser className="mx-auto mb-2 text-cyan-400" size={28}/>
                                    <p className="text-3xl font-bold">{reportData.length}</p>
                                    <p className="text-gray-400">Toplam Kayıt Sayısı</p>
                                </div>
                             </div>
                        </GlassCard>
                        
                        <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
                            <h2 className="text-xl font-bold mb-4">Personel Bazlı Detaylar</h2>
                            <div className="space-y-2">
                                {Array.from(processedData.groupedByUser.entries()).sort((a,b) => b[1].totalSeconds - a[1].totalSeconds).map(([userName, data]) => {
                                    const isExpanded = expandedUser === userName;
                                    return (
                                    <div key={userName} className="bg-white/5 rounded-lg overflow-hidden transition-all duration-300">
                                        <button 
                                            onClick={() => handleToggleUser(userName)}
                                            className="w-full flex justify-between items-center p-4 text-left hover:bg-white/10"
                                        >
                                            <h3 className="text-lg font-semibold text-white">{userName}</h3>
                                            <div className="flex items-center gap-4">
                                                <p className="font-bold text-cyan-400">Toplam: {secondsToTimeString(data.totalSeconds)}</p>
                                                {isExpanded ? <ChevronUp /> : <ChevronDown />}
                                            </div>
                                        </button>
                                        
                                        {isExpanded && (
                                            <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                                <div className="overflow-x-auto border-t border-white/10 pt-2">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="text-gray-400">
                                                            <tr>
                                                                <th className="p-2">Tarih</th>
                                                                <th className="p-2">Planlanan</th>
                                                                <th className="p-2">Gerçekleşen</th>
                                                                <th className="p-2 text-right">Fazla Mesai</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.records.map((rec, index) => (
                                                                <tr key={index} className="border-t border-white/10">
                                                                    <td className="p-2">{new Date(rec.date.replace(/-/g, '/')).toLocaleDateString('tr-TR')}</td>
                                                                    <td className="p-2">{rec.scheduledStart} - {rec.scheduledEnd}</td>
                                                                    <td className="p-2">{rec.actualStart} - {rec.actualEnd}</td>
                                                                    <td className="p-2 text-right font-semibold">{secondsToTimeString(rec.totalOvertimeSeconds)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )})}
                            </div>
                        </GlassCard>
                    </>
                )}

            </div>
        </div>
    );
}