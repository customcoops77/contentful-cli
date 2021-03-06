import { getContext } from '../../context'
import { assertLoggedIn, assertSpaceIdProvided } from '../../utils/assertions'
import { handleAsyncError as handle } from '../../utils/async'
import { createManagementClient } from '../../utils/contentful-clients'
import { successEmoji } from '../../utils/emojis'
import { success } from '../../utils/log'

import {
  assertExtensionValuesProvided,
  assertForceOrCorrectVersionProvided
} from './utils/assertions'
import { logExtension } from './utils/log-as-table'
import prepareData from './utils/prepare-data'
import readSrcDocFile from './utils/read-srcdoc-file'

export const command = 'update'

export const desc = 'Update an extension'

export const builder = (yargs) => {
  return yargs
    .option('id', { type: 'string', describe: 'Extension id' })
    .option('name', { type: 'string', describe: 'Extension name' })
    .option('space-id', { type: 'string', describe: 'Space id' })
    .option('field-types', { type: 'array', describe: 'Field types' })
    .option('descriptor', { type: 'string', describe: 'Path to an extension descriptor file' })
    .option('src', { type: 'string', describe: 'URL to extension bundle' })
    .option('srcdoc', { type: 'string', describe: 'Path to extension bundle' })
    .option('sidebar', {
      type: 'boolean',
      // We set the default to undefined so the descriptor file value will be
      // used instead of arg value unless explicitly passed in
      default: undefined,
      describe: 'Render the extension in the sidebar'
    })
    .option('version', {
      type: 'number',
      describe: 'Current version of the extension for optimistic locking'
    })
    .option('force', {
      type: 'boolean',
      describe: 'Force operation without explicit version'
    })
    .epilog('Copyright 2018 Contentful, this is a BETA release')
}

export async function updateExtension (argv) {
  await assertLoggedIn()
  await assertSpaceIdProvided(argv)

  const data = await prepareData(argv)

  await assertExtensionValuesProvided(data, 'update')

  if (data.extension.srcdoc) {
    await readSrcDocFile(data.extension)
  }

  const { cmaToken, activeSpaceId } = await getContext()
  const spaceId = argv.spaceId || activeSpaceId

  const client = await createManagementClient({
    accessToken: cmaToken
  })

  const space = await client.getSpace(spaceId)
  const extension = await space.getUiExtension(data.id)

  await assertForceOrCorrectVersionProvided(argv, extension.sys.version)

  extension.extension = data.extension

  const updated = await extension.update()

  success(`${successEmoji} Successfully updated extension:\n`)

  logExtension(updated)
}

export const handler = handle(updateExtension)
