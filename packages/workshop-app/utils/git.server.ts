import { execaCommand } from 'execa'
import { getWorkshopRoot } from './apps.server.ts'
import { getErrorMessage, getPkgProp } from './utils.ts'

const cwd = getWorkshopRoot()

async function getDiffUrl(commitBefore: string, commitAfter: string) {
	try {
		const { stdout: remoteUrl } = await execaCommand(
			'git config --get remote.origin.url',
			{ cwd },
		)
		const [, username, repoName] =
			remoteUrl.match(/:([^/]+)\/([^.]+)\.git/) ?? []
		const diffUrl = `https://github.com/${username}/${repoName}/compare/${commitBefore}...${commitAfter}`
		return diffUrl
	} catch (error) {
		console.error('Failed to get repository info:', getErrorMessage(error))
		return null
	}
}

export async function checkForUpdates() {
	let localCommit
	let remoteCommit
	try {
		await execaCommand('git fetch origin', { cwd })

		const currentBranch = (
			await execaCommand('git rev-parse --abbrev-ref HEAD', { cwd })
		).stdout.trim()

		localCommit = (
			await execaCommand('git rev-parse --short HEAD', { cwd })
		).stdout.trim()
		remoteCommit = (
			await execaCommand(`git rev-parse --short origin/${currentBranch}`, {
				cwd,
			})
		).stdout.trim()

		return {
			updatesAvailable: localCommit !== remoteCommit,
			localCommit,
			remoteCommit,
			diffLink: await getDiffUrl(localCommit, remoteCommit),
		}
	} catch (error) {
		console.error('Unable to check for updates', error)
		return {
			updatesAvailable: false,
			localCommit,
			remoteCommit,
			diffLink:
				localCommit && remoteCommit
					? await getDiffUrl(localCommit, remoteCommit)
					: null,
		}
	}
}

export async function updateLocalRepo() {
	try {
		const updates = await checkForUpdates()
		if (!updates.updatesAvailable) {
			return { status: 'success', message: 'No updates available.' } as const
		}

		const uncommittedChanges =
			(await execaCommand('git status --porcelain', { cwd })).stdout.trim()
				.length > 0

		if (uncommittedChanges) {
			console.log('👜 Stashing uncommitted changes...')
			await execaCommand('git stash', { cwd })
		}

		console.log('⬇️ Pulling latest changes...')
		await execaCommand('git pull origin HEAD', { cwd })

		if (uncommittedChanges) {
			console.log('👜 re-applying stashed changes...')
			await execaCommand('git stash pop', { cwd })
		}

		console.log('📦 Re-installing dependencies...')
		await execaCommand('npm install', { cwd, stdio: 'inherit' })

		const postUpdateScript = await getPkgProp(
			cwd,
			'kcd-workshop.scripts.postupdate',
			null,
		)
		if (postUpdateScript) {
			console.log('🏃 Running post update script...')
			await execaCommand(postUpdateScript, { cwd, stdio: 'inherit' })
		}

		return { status: 'success', message: 'Updated successfully.' } as const
	} catch (error) {
		return { status: 'error', message: getErrorMessage(error) } as const
	}
}
