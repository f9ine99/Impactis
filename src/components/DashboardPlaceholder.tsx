import type { PlaceholderDashboardView } from '@/modules/dashboard'

export default function DashboardPlaceholder({ view }: { view: PlaceholderDashboardView }) {
    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <span className="inline-flex items-center rounded-full bg-[#0B3D2E]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0B3D2E]">
                    {view.badge}
                </span>
                <h1 className="mt-4 text-3xl font-black text-gray-900">{view.title}</h1>
                <p className="mt-2 max-w-2xl text-gray-600">{view.subtitle}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {view.stats.map((stat) => (
                    <article key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="mt-2 text-sm text-gray-500">{stat.note}</p>
                    </article>
                ))}
            </div>

            <section className="rounded-3xl border border-dashed border-gray-300 bg-white p-8">
                <h2 className="text-lg font-bold text-gray-900">Planned Sections</h2>
                <ul className="mt-4 space-y-3">
                    {view.plannedSections.map((section, index) => (
                        <li key={section} className="flex items-center gap-3 text-gray-700">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                                {index + 1}
                            </span>
                            <span>{section}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}
