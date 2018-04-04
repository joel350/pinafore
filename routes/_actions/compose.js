import { store } from '../_store/store'
import { toast } from '../_utils/toast'
import { postStatus as postStatusToServer } from '../_api/statuses'
import { addStatusOrNotification } from './addStatusOrNotification'
import { database } from '../_database/database'

export async function insertHandleForReply (statusId) {
  let instanceName = store.get('currentInstance')
  let status = await database.getStatus(instanceName, statusId)
  let verifyCredentials = store.get('currentVerifyCredentials')
  let originalStatus = status.reblog || status
  let accounts = [originalStatus.account].concat(originalStatus.mentions || [])
    .filter(account => account.id !== verifyCredentials.id)
  if (!store.getComposeData(statusId, 'text') && accounts.length) {
    store.setComposeData(statusId, {
      text: accounts.map(account => `@${account.acct} `).join('')
    })
  }
}

export async function postStatus (realm, text, inReplyToId, mediaIds,
                                  sensitive, spoilerText, visibility) {
  let instanceName = store.get('currentInstance')
  let accessToken = store.get('accessToken')
  let online = store.get('online')

  if (!online) {
    toast.say('You cannot post while offline')
    return
  }

  store.set({
    postingStatus: true,
    postedStatusForRealm: null
  })
  try {
    let status = await postStatusToServer(instanceName, accessToken, text,
      inReplyToId, mediaIds, sensitive, spoilerText, visibility)
    addStatusOrNotification(instanceName, 'home', status)
    store.clearComposeData(realm)
    store.set({
      postedStatusForRealm: realm
    })
  } catch (e) {
    toast.say('Unable to post status: ' + (e.message || ''))
  } finally {
    store.set({postingStatus: false})
  }
}

export async function insertUsername (realm, username, startIndex, endIndex) {
  let oldText = store.getComposeData(realm, 'text')
  let pre = oldText.substring(0, startIndex)
  let post = oldText.substring(endIndex)
  let newText = `${pre}@${username} ${post}`
  store.setComposeData(realm, {text: newText})
}

export async function clickSelectedAutosuggestionUsername (realm) {
  let selectionStart = store.get('composeSelectionStart')
  let searchText = store.get('composeAutosuggestionSearchText')
  let selection = store.get('composeAutosuggestionSelected') || 0
  let account = store.get('composeAutosuggestionSearchResults')[selection]
  let startIndex = selectionStart - searchText.length
  let endIndex = selectionStart
  await insertUsername(realm, account.acct, startIndex, endIndex)
}

export function setReplySpoiler (realm, spoiler) {
  let contentWarning = store.getComposeData(realm, 'contentWarning')
  let contentWarningShown = store.getComposeData(realm, 'contentWarningShown')
  if (typeof contentWarningShown === 'undefined' && !contentWarning) {
    // user hasn't interacted with the CW yet
    store.setComposeData(realm, {
      contentWarning: spoiler,
      contentWarningShown: true
    })
  }
}

const PRIVACY_LEVEL = {
  'direct': 1,
  'private': 2,
  'unlisted': 3,
  'public': 4
}

export function setReplyVisibility (realm, replyVisibility) {
  // return the most private between the user's preferred default privacy
  // and the privacy of the status they're replying to
  let verifyCredentials = store.get('currentVerifyCredentials')
  let defaultVisibility = verifyCredentials.source.privacy
  let visibility = PRIVACY_LEVEL[replyVisibility] < PRIVACY_LEVEL[defaultVisibility]
    ? replyVisibility
    : defaultVisibility
  store.setComposeData(realm, {postPrivacy: visibility})
}
