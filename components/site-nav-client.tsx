'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AtomeIcon } from './icons/atome-icon'

type SiteNavClientProps = {
    isLoggedIn: boolean
    isAdmin: boolean
    atomes: number
    articlesPanier: number
    signOut: () => Promise<void>
}

export function SiteNavClient({
    isLoggedIn,
    isAdmin,
    atomes,
    articlesPanier,
    signOut,
}: SiteNavClientProps) {
    const [openMenu, setOpenMenu] = useState<'boutique' | 'compte' | null>(null)
    const navRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setOpenMenu(null)
            }
        }
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpenMenu(null)
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    function toggleMenu(menu: 'boutique' | 'compte') {
        setOpenMenu((current) => (current === menu ? null : menu))
    }

    return (
        <header className="border-b border-line">
            <div
                ref={navRef}
                className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4"
            >
                <Link href="/" className="flex items-center gap-2 font-display text-lg tracking-tight text-ink">
                    <Image
                        src="/image/GPIG_logo.png"
                        alt="GPIG"
                        width={40}
                        height={40}
                        priority
                    />
                    <span className="text-moss-700">GPIG</span>
                </Link>

                <nav className="flex items-center gap-6 text-sm">
                    <Link href="/formations" className="text-ink-soft hover:text-ink">
                        Formations
                    </Link>
                    <Link href="/classement" className="text-ink-soft hover:text-ink">
                        Classement
                    </Link>

                    {/* Dropdown Boutique */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => toggleMenu('boutique')}
                            className="flex items-center gap-1 text-ink-soft hover:text-ink"
                            aria-expanded={openMenu === 'boutique'}
                            aria-haspopup="menu"
                        >
                            Boutique
                            <ChevronIcon open={openMenu === 'boutique'} />
                        </button>

                        {openMenu === 'boutique' && (
                            <div
                                role="menu"
                                className="absolute left-0 top-full mt-2 w-56 rounded-lg border border-line bg-white py-2 shadow-lg"
                            >
                                <DropdownLink href="/boutique" onClick={() => setOpenMenu(null)}>
                                    Voir la boutique
                                </DropdownLink>

                                {isLoggedIn && (
                                    <>
                                        <DropdownLink
                                            href="/boutique/packs-atomes"
                                            onClick={() => setOpenMenu(null)}
                                        >
                                            <span className="flex items-center justify-between">
                                                Packs d'Atomes
                                                <span className="flex items-center gap-1 text-xs text-ink-soft">
                                                    {atomes}
                                                    <AtomeIcon className="h-3.5 w-3.5" />
                                                </span>
                                            </span>
                                        </DropdownLink>

                                        <DropdownLink
                                            href="/boutique/panier"
                                            onClick={() => setOpenMenu(null)}
                                        >
                                            <span className="flex items-center justify-between">
                                                Panier
                                                {articlesPanier > 0 && (
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-moss-700 text-[10px] text-white">
                                                        {articlesPanier}
                                                    </span>
                                                )}
                                            </span>
                                        </DropdownLink>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {isLoggedIn ? (
                        <>
                            {/* Raccourci atomes visible directement */}
                            <Link
                                href="/boutique/packs-atomes"
                                className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-ink-soft hover:border-moss-600 hover:text-moss-700"
                                title="Solde d'Atomes"
                            >
                                <span>{atomes}</span>
                                <AtomeIcon className="h-4 w-4" />
                            </Link>

                            {/* Raccourci panier visible directement */}
                            <Link
                                href="/boutique/panier"
                                className="relative flex items-center text-ink-soft hover:text-ink"
                                title="Panier"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={1.8}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5"
                                    aria-hidden
                                >
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                                {articlesPanier > 0 && (
                                    <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-moss-700 text-[10px] text-white">
                                        {articlesPanier}
                                    </span>
                                )}
                            </Link>

                            {/* Dropdown Compte */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => toggleMenu('compte')}
                                    className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-ink-soft hover:border-moss-600 hover:text-moss-700"
                                    aria-expanded={openMenu === 'compte'}
                                    aria-haspopup="menu"
                                >
                                    Compte
                                    <ChevronIcon open={openMenu === 'compte'} />
                                </button>

                                {openMenu === 'compte' && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-line bg-white py-2 shadow-lg"
                                    >
                                        <DropdownLink href="/dashboard" onClick={() => setOpenMenu(null)}>
                                            Tableau de bord
                                        </DropdownLink>

                                        {!isAdmin && (
                                            <DropdownLink
                                                href="/rendez-vous"
                                                onClick={() => setOpenMenu(null)}
                                            >
                                                Rendez-vous
                                            </DropdownLink>
                                        )}

                                        {isAdmin && (
                                            <DropdownLink
                                                href="/admin/rendez-vous"
                                                onClick={() => setOpenMenu(null)}
                                            >
                                                Rendez-vous
                                            </DropdownLink>
                                        )}

                                        <div className="my-1 border-t border-line" />

                                        <form action={signOut}>
                                            <button
                                                type="submit"
                                                className="block w-full px-4 py-2 text-left text-ink-soft hover:bg-moss-50 hover:text-ink"
                                            >
                                                Déconnexion
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="rounded-full bg-moss-700 px-4 py-1.5 text-white hover:bg-moss-800"
                        >
                            Connexion
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    )
}

function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}

function DropdownLink({
    href,
    onClick,
    children,
}: {
    href: string
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <Link
            href={href}
            role="menuitem"
            onClick={onClick}
            className="block px-4 py-2 text-ink-soft hover:bg-moss-50 hover:text-ink"
        >
            {children}
        </Link>
    )
}