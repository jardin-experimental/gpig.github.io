"use client";

import { useState, useTransition } from "react";
import { ajouterAuPanier } from "@/app/boutique/actions";

export function AddToCartButton({ produitId }: { produitId: string }) {
    const [quantite, setQuantite] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [confirme, setConfirme] = useState(false);

    function handleAdd() {
        startTransition(async () => {
            await ajouterAuPanier(produitId, quantite);
            setConfirme(true);
            setTimeout(() => setConfirme(false), 2000);
        });
    }

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-line">
                <button
                    type="button"
                    className="px-3 py-1 text-ink-soft"
                    onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                    aria-label="Diminuer la quantité"
                >
                    −
                </button>
                <span className="w-8 text-center font-mono">{quantite}</span>
                <button
                    type="button"
                    className="px-3 py-1 text-ink-soft"
                    onClick={() => setQuantite((q) => q + 1)}
                    aria-label="Augmenter la quantité"
                >
                    +
                </button>
            </div>

            <button
                type="button"
                onClick={handleAdd}
                disabled={isPending}
                className="mt-8 w-full rounded-lg bg-moss-700 px-6 py-3 font-medium text-white transition hover:bg-moss-800"
            >
                {confirme ? "Ajouté ✓" : isPending ? "Ajout…" : "Ajouter au panier"}
            </button>
        </div>
    );
}