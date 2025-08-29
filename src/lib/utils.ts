type WeekendConfiguration = 'sunday_only' | 'saturday_sunday';

export function calculateWorkingDays(
  startDate: string,
  endDate: string,
  holidays: string[] = [],
  weekendConfig: WeekendConfiguration = 'saturday_sunday' // YENİ PARAMETRE
): number {
  let count = 0;
  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);
  
  currentDate.setUTCHours(12,0,0,0);
  lastDate.setUTCHours(12,0,0,0);
  
  while (currentDate <= lastDate) {
    const dayOfWeek = currentDate.getUTCDay(); // 0 = Pazar, 6 = Cumartesi
    
    // YENİ: Hafta sonu mantığı artık dinamik
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
