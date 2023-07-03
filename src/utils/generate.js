/**
 * 生成唯一ID
 * @returns
 */
export function generateId() {
    const s = [];
    const hexDigits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < 19; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 36), 1);
    }
    s[4] = s[9] = s[14] = "-";
    return s.join("");
}
