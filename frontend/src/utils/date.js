import { formatDateKey } from '../context/AppContext';

export function getDayName(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
}

export function getShortMonthName(month) {
    return getMonthName(month).substring(0, 3);
}

export function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

export function isSameDay(date1, date2) {
    return formatDateKey(date1) === formatDateKey(date2);
}

export function isPastDate(year, month, day) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    return checkDate < today;
}

export function isPastMonth(year, month) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    return year < currentYear || (year === currentYear && month < currentMonth);
}

export function generateMonthGrid(year, month) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = [];

    // Previous month padding
    const prevMonthVal = month === 0 ? 11 : month - 1;
    const prevYearVal = month === 0 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(prevYearVal, prevMonthVal);

    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const dateKey = `${prevYearVal}-${String(prevMonthVal + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push({ day, type: 'prev', dateKey });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push({ day, type: 'curr', dateKey });
    }

    // Next month padding
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const nextDays = totalCells - firstDay - daysInMonth;
    const nextMonthVal = month === 11 ? 0 : month + 1;
    const nextYearVal = month === 11 ? year + 1 : year;

    for (let day = 1; day <= nextDays; day++) {
        const dateKey = `${nextYearVal}-${String(nextMonthVal + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push({ day, type: 'next', dateKey });
    }

    return cells;
}

