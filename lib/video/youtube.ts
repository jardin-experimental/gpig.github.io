export function getYoutubeVideoId(url: string): string | null {
    const match = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/
    )

    return match?.[1] ?? null
}

export function getYoutubeEmbedUrl(url: string): string | null {
    const id = getYoutubeVideoId(url)

    return id ? `https://www.youtube.com/embed/${id}` : null
}