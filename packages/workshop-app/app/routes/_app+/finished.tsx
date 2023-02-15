import { json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import {
	getAppPageRoute,
	getApps,
	getWorkshopTitle,
	isExerciseStepApp,
} from '~/utils/apps.server'

export async function loader() {
	const apps = (await getApps()).filter(isExerciseStepApp)
	const prevApp = apps[apps.length - 1]
	return json({
		workshopTitle: await getWorkshopTitle(),
		prevStepLink: prevApp
			? {
					to: getAppPageRoute(prevApp),
					children: `⬅️ ${prevApp.title} (${prevApp.type})`,
			  }
			: null,
	})
}

export default function ExerciseFeedback() {
	const data = useLoaderData<typeof loader>()
	const searchParams = new URLSearchParams([
		['embedded', 'true'],
		['entry.2123647600', data.workshopTitle],
	])
	return (
		<div className="container mx-auto h-full">
			<h1>You've finished! 🎉</h1>
			<iframe
				className="mx-auto h-full min-w-full max-w-2xl rounded-md border-2 border-gray-200"
				title="Feedback"
				src={`https://docs.google.com/forms/d/e/1FAIpQLSdRmj9p8-5zyoqRzxp3UpqSbC3aFkweXvvJIKes0a5s894gzg/viewform?${searchParams.toString()}`}
			>
				Loading…
			</iframe>
			<div className="flex justify-around">
				{data.prevStepLink ? (
					<Link
						prefetch="intent"
						className="text-blue-700 underline"
						to={data.prevStepLink.to}
						children={data.prevStepLink.children}
					/>
				) : null}
			</div>
		</div>
	)
}
