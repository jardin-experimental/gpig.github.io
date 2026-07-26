import { isYoutube } from "@/lib/video/video"
import { getYoutubeEmbedUrl } from "@/lib/video/youtube"

type Props = {
    url: string
}

export function VideoPlayer({ url }: Props) {
    if (isYoutube(url)) {
        return (
            <iframe
                src={getYoutubeEmbedUrl(url)!}
                className="aspect-video w-full rounded-lg"
                allowFullScreen
            />
        )
    }

    return (
        <video
            src={url}
            controls
            className="aspect-video w-full rounded-lg"
        />
    )
}