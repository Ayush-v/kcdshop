// originally this was based on baffle-react, but it was unnecessarily bloated
// and very out-dated. I've replaced it with a simple Characters component that
// does the same thing we were using baffle-react for
import { useEffect, useRef, useState } from 'react'
import { useHints } from '~/utils/client-hints.tsx'

export function Loading({
	children = 'Loading',
}: {
	children?: React.ReactNode
}) {
	const { reducedMotion } = useHints()
	if (reducedMotion === 'reduce') {
		return <div className="animate-pulse">{children}</div>
	}

	return (
		<div
			className="flex items-center gap-2 font-mono text-sm font-medium uppercase"
			role="status"
		>
			<div aria-hidden="true">
				<Characters />
			</div>
			{children}
			<div aria-hidden="true">
				<Characters />
			</div>
		</div>
	)
}

const characters = '█<▓█ ▒░/▒░ █░>▒▓/ █▒▒ ▓▒▓/█<░▒ ▓/░>'
const randomCharacter = () =>
	characters[Math.floor(Math.random() * characters.length)]
export function Characters() {
	const [char1, setChar1] = useState(characters[0])
	const [char2, setChar2] = useState(characters[1])

	useInterval(() => {
		setChar1(randomCharacter())
		setChar2(randomCharacter())
	}, 80)

	return (
		<span>
			{char1}
			{char2}
		</span>
	)
}

function useInterval(callback: () => void, delay = 1000) {
	const savedCallback = useRef<() => void>()

	// Remember the latest function.
	useEffect(() => {
		savedCallback.current = callback
	}, [callback])

	// Set up the interval.
	useEffect(() => {
		function tick() {
			savedCallback.current?.()
		}
		if (delay !== null) {
			let id = setInterval(tick, delay)
			return () => clearInterval(id)
		}
	}, [delay])
}
