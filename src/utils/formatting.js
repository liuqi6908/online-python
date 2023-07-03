/**
 * 格式化时间
 * @param {string | null} str 需格式化的时间
 * @returns
 */
export function formatDateTime(str) {
    const dateTime = str ? new Date(str) : new Date();
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Intl.DateTimeFormat('zh-CN', options).format(dateTime);
}
