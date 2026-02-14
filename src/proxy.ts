import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { decideMiddlewareNavigation } from '@/modules/auth'
import { getResolvedRoleForUser } from '@/modules/profiles'

export async function proxy(request: NextRequest) {
    const { supabaseResponse, user, supabase } = await updateSession(request)

    const url = request.nextUrl.clone()
    const role = user ? await getResolvedRoleForUser(supabase, user) : null
    const decision = decideMiddlewareNavigation({
        pathname: url.pathname,
        user,
        role,
    })

    if (decision.type === 'redirect') {
        url.pathname = decision.destination
        if (decision.unauthorized) {
            url.searchParams.set('error', 'unauthorized')
        } else {
            url.searchParams.delete('error')
        }
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
