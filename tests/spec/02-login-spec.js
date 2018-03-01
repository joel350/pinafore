import { Selector as $ } from 'testcafe'
import {
  authorizeInput, emailInput, formError, getUrl, instanceInput, passwordInput,
  settingsButton
} from '../utils'

fixture`02-login-spec.js`
  .page`http://localhost:4002`

function manualLogin (t, username, password) {
  return t.click($('a').withText('log in to an instance'))
    .expect(getUrl()).contains('/settings/instances/add')
    .typeText(instanceInput, 'localhost:3000')
    .pressKey('enter')
    .expect(getUrl()).eql('http://localhost:3000/auth/sign_in')
    .typeText(emailInput, username, {paste: true})
    .typeText(passwordInput, password, {paste: true})
    .pressKey('enter')
    .expect(getUrl()).contains('/oauth/authorize')
    .click(authorizeInput)
    .expect(getUrl()).eql('http://localhost:4002/')
}

test('Cannot log in to a fake instance', async t => {
  await t.click($('a').withText('log in to an instance'))
    .expect(getUrl()).contains('/settings/instances/add')
    .typeText(instanceInput, 'fake.nolanlawson.com', {paste: true})
    .pressKey('enter')
    .expect(formError.exists).ok()
    .expect(formError.innerText).contains('Is this a valid Mastodon instance?')
    .typeText(instanceInput, '.biz', {paste: true})
    .expect(formError.exists).notOk()
    .typeText(instanceInput, 'fake.nolanlawson.com', {paste: true, replace: true})
    .expect(formError.exists).ok()
    .expect(formError.innerText).contains('Is this a valid Mastodon instance?')
})

test('Logs in and logs out of localhost:3000', async t => {
  await manualLogin(t, 'foobar@localhost:3000', 'foobarfoobar')
    .expect($('article.status-article').exists).ok()
    .click(settingsButton)
    .click($('a').withText('Instances'))
    .click($('a').withText('localhost:3000'))
    .expect(getUrl()).contains('/settings/instances/localhost:3000')
    .expect($('.instance-name-h1').innerText).eql('localhost:3000')
    .expect($('.acct-handle').innerText).eql('@foobar')
    .expect($('.acct-display-name').innerText).eql('foobar')
    .click($('button').withText('Log out'))
    .click($('#modal-dialog button').withText('OK'))
    .expect($('.container').innerText)
    .contains("You're not logged in to any instances")
})
