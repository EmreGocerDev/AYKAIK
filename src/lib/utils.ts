// YOL: src/lib/utils.ts

type WeekendConfiguration = 'sunday_only' | 'saturday_sunday';

// Bu fonksiyon, 'YYYY-MM-DD' formatındaki tarihleri tüm tarayıcılarda
 // sorunsuz çalışan 'YYYY/MM/DD' formatına çevirir. [cite: 2132, 2133]
export const safeNewDate = (dateString: string | number | Date): Date => {
  if (typeof dateString === 'string') {
     // Tarih string'i içindeki '-' karakterlerini '/' ile değiştiriyoruz. [cite: 2134]
    return new Date(dateString.replace(/-/g, '/'));
  }
  return new Date(dateString);
};

export function calculateWorkingDays(
  startDate: string,
  endDate: string,
  holidays: string[] = [],
  weekendConfig: WeekendConfiguration = 'saturday_sunday'
): number {
  let count = 0;
   const currentDate = safeNewDate(startDate); 
   const lastDate = safeNewDate(endDate); 
  
  currentDate.setUTCHours(12,0,0,0);
  lastDate.setUTCHours(12,0,0,0);

   while (currentDate <= lastDate) { 
     const dayOfWeek = currentDate.getUTCDay(); 
    const isWeekend = weekendConfig === 'saturday_sunday'
       ? dayOfWeek === 0 || dayOfWeek === 6 
       : dayOfWeek === 0; 
      
    const isoDate = currentDate.toISOString().split('T')[0];
    const isHoliday = holidays.includes(isoDate);
   if (!isWeekend && !isHoliday) {
       count++; 
    }
    
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  
  return count; 
}