import Link from 'next/link'
import { GrowthMeter } from '@/components/growth-meter'

export default function HomePage() {
  return (
    <main>
      <section className="field-grid border-b border-line">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-moss-700">
            Carnet de bord n°1 — expérimentation
          </p>
          <h1 className="max-w-2xl font-display text-4xl leading-tight text-ink sm:text-5xl">
            On n&apos;apprend pas en lisant une notice.
            <br />
            On apprend en plantant, en ratant, en recommençant.
          </h1>
          <p className="mt-6 max-w-xl text-ink-soft">
            GPIG est un jardin expérimental : des formations, des défis et une
            communauté pensés pour apprendre par la pratique — pas à pas, à votre
            rythme, avec de vrais paliers de progression.
          </p>

          <div className="mt-8 flex gap-3">
            <Link
              href="/formations"
              className="rounded-full bg-moss-700 px-5 py-2.5 text-sm text-white hover:bg-moss-800"
            >
              Explorer les formations
            </Link>
            {/* <Link
              href="/register"
              className="rounded-full border border-line px-5 py-2.5 text-sm text-ink hover:border-moss-600"
            >
              Créer un compte
            </Link> */}
          </div>

          <div className="mt-14 max-w-md rounded-lg border border-line bg-white/60 p-5">
            <p className="mb-3 text-xs text-ink-soft">
              Chaque leçon terminée, chaque quiz réussi fait grandir votre parcours.
            </p>
            <GrowthMeter niveau={3} xp={40} xpProchainNiveau={100} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-16 sm:grid-cols-3">
        <Principe
          titre="Expérimentation"
          texte="Chaque module se termine par un exercice concret, pas juste une lecture."
        />
        <Principe
          titre="Autonomie"
          texte="Vous avancez à votre rythme ; le déverrouillage suit votre progression réelle."
        />
        <Principe
          titre="Progression"
          texte="XP, niveaux et badges rendent visible ce que vous avez réellement appris."
        />
      </section>
    </main>
  )
}

function Principe({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div>
      <h2 className="mb-2 font-display text-lg text-ink">{titre}</h2>
      <p className="text-sm text-ink-soft">{texte}</p>
    </div>
  )
}
