import { instanceObservers } from './instanceObservers'
import { timelineObservers } from './timelineObservers'
import { notificationObservers } from './notificationObservers'
import { autosuggestObservers } from './autosuggestObservers'
import { notificationPermissionObservers } from './notificationPermissionObservers'
import { customScrollbarObservers } from './customScrollbarObservers'
import { customEmojiObservers } from './customEmojiObservers'
import { cleanup } from './cleanup'
import { filterObservers } from './filterObservers'

// These observers can be lazy-loaded when the user is actually logged in.
// Prevents circular dependencies and reduces the size of main.js
export function loggedInObservers () {
  instanceObservers()
  timelineObservers()
  filterObservers()
  notificationObservers()
  autosuggestObservers()
  notificationPermissionObservers()
  customScrollbarObservers()
  customEmojiObservers()
  cleanup()
}
