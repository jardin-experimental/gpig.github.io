export function isYoutube(url: string) {
    return /youtube\.com|youtu\.be/.test(url)
}

export function isMp4(url: string) {
    return url.endsWith(".mp4")
}