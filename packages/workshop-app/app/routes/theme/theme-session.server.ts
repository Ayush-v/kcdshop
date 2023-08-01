import * as cookie from 'cookie'

const cookieName = 'KCDShop_theme'
export type Theme = 'light' | 'dark'

export function getTheme(request: Request): Theme | null {
	const cookieHeader = request.headers.get('cookie')
	const parsed = cookieHeader ? cookie.parse(cookieHeader)[cookieName] : null
	if (parsed === 'light' || parsed === 'dark') return parsed
	return null
}

export function setTheme(theme: Theme | 'system') {
	return cookie.serialize(cookieName, theme, {
		path: '/',
		expires:
			theme === 'system'
				? new Date(0)
				: new Date(Date.now() + 60 * 60 * 365 * 1000),
	})
}
