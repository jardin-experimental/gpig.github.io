export function AtomeIcon({ className = 'h-6 w-6' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className={className}
            aria-hidden
        >
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <ellipse
                cx="12"
                cy="12"
                rx="10"
                ry="4.5"
                transform="rotate(0 12 12)"
            />
            <ellipse
                cx="12"
                cy="12"
                rx="10"
                ry="4.5"
                transform="rotate(60 12 12)"
            />
            <ellipse
                cx="12"
                cy="12"
                rx="10"
                ry="4.5"
                transform="rotate(120 12 12)"
            />
        </svg>
    )
}