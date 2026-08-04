'use client'

import { useState } from 'react'

export function ProduitGallery({
    images,
    nom,
}: {
    images: string[] | null
    nom: string
}) {
    const [selectedImage, setSelectedImage] = useState<string | null>(
        images?.[0] ?? null
    )

    return (
        <div>
            {/* Image principale */}
            <div className="overflow-hidden rounded-xl border border-line bg-moss-50">
                {selectedImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={selectedImage}
                        alt={nom}
                        className="aspect-square w-full object-cover"
                    />
                ) : (
                    <div className="flex aspect-square items-center justify-center text-7xl">
                        🔬
                    </div>
                )}
            </div>

            {/* Aperçus (3 photos) */}
            {images && images.length > 1 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                    {images.slice(0, 3).map((url, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedImage(url)}
                            className={`overflow-hidden rounded-lg border bg-moss-50 transition ${selectedImage === url
                                    ? 'border-moss-700 ring-2 ring-moss-700'
                                    : 'border-line hover:border-moss-400'
                                }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={url}
                                alt={`${nom} - aperçu ${index + 1}`}
                                className="aspect-square w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}