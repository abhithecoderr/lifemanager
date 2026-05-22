export function formatTime12h(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function time24ToParts(time24) {
    if (!time24) {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const roundedMin = Math.round(minutes / 5) * 5;
        const minStr = String(roundedMin === 60 ? 0 : roundedMin).padStart(2, '0');
        return { h: String(hours), m: minStr, p: ampm };
    }
    const [hours24, minutes] = time24.split(':');
    const h24 = parseInt(hours24);
    const p = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 || 12;
    return { h: h12.toString(), m: minutes, p: p };
}

export function partsToTime24(h, m, p) {
    if (!h) return null;
    let h24 = parseInt(h);
    if (p === "PM" && h24 < 12) h24 += 12;
    if (p === "AM" && h24 === 12) h24 = 0;
    return `${String(h24).padStart(2, '0')}:${m}`;
}

export function calculateEndTime(startTime24, durationMins) {
    if (!startTime24 || !durationMins) return '';
    const [hours, minutes] = startTime24.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + Number(durationMins));
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

export function formatDurationReadable(mins) {
    if (!mins) return '';
    const m = Number(mins);
    if (m < 60) return `(${m} mins)`;
    const hours = m / 60;
    if (hours % 1 === 0) return `(${hours} hours)`;
    return `(${hours.toFixed(1)} hours)`;
}

export function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

export function formatRemainingTime(minsLeft) {
    if (minsLeft <= 0) return 'Ending soon';
    if (minsLeft < 60) return `${minsLeft}m left`;
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    if (m === 0) return `${h}h left`;
    return `${h}h ${m}m left`;
}
