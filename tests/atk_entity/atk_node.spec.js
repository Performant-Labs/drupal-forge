/**
 * atk_node.spec.js
 *
 * Validate node entities.
 *
 */

/** ESLint directives */
/* eslint-disable import/first */

// Set up Playwright.
import { expect, test } from '@playwright/test'

import * as atkCommands from '../support/atk_commands'
import * as atkUtilities from '../support/atk_utilities'

import playwrightConfig from '../../playwright.config'

const baseUrl = playwrightConfig.use.baseURL

// Import ATK configuration.
import atkConfig from '../../playwright.atk.config'

// Holds standard accounts that use user accounts created
// by QA Accounts. QA Accounts are created when the QA
// Accounts module is enabled.
import qaUserAccounts from '../data/qaUsers.json'

test.describe('Node tests.', () => {
  // Node IDs to clean up after the test run.
  const tmpNid = []

  //
  // Create a page with an image, confirm it, update it, confirm update then delete it via the UI.
  //
  test('(ATK-PW-1110) Create, update, delete a page via the UI. @ATK-PW-1110 @node @smoke @alters-db', async ({ page, context }) => {
    const testId = 'ATK-PW-1110'
    let bodyText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean a ultrices tortor.'

    // Log in with the administrator account.
    // You should change this to an account other than the administrator,
    // which has all rights.
    await atkCommands.logInViaForm(page, context, qaUserAccounts.admin)

    //
    // Add a page.
    //
    await page.goto(baseUrl + atkConfig.pageAddUrl)

    // Fill in as many fields as you need here.
    const titleTextField = await page.locator('input[name="title[0][value]"]')
    await titleTextField.fill(`${testId}: A Title`)

    // Use these two lines for older versions of Drupal.
    // let ckEditor = await page.locator('[aria-label="Editor editing area: main"]')
    // await ckEditor.fill(bodyText)
    await atkCommands.inputTextIntoCKEditor(page, bodyText)

    await page.getByRole('button', { name: 'Save' }).first().click()

    //
    // Confirm content appears.
    //
    await expect(page.getByText(bodyText)).toBeVisible()

    // Get the nid.
    const nid = await atkCommands.getNid(page)
    tmpNid.push(nid)

    //
    // Update the node.
    //
    bodyText = 'Ut eget ex vitae nibh dapibus vulputate ut id lacus.'

    const editPageUrl = atkConfig.nodeEditUrl.replace('{nid}', `${nid}`)
    await page.goto(editPageUrl)
    // Use these two lines for older versions of Drupal.
    // ckEditor = await page.locator('[aria-label="Editor editing area: main"]')
    // await ckEditor.fill(bodyText)
    await atkCommands.inputTextIntoCKEditor(page, bodyText)
    // Timeouts necessary when running at full speed.
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Save' }).first().click()
    await page.waitForTimeout(1000)

    //
    // Confirm content has changed.
    //
    await expect(page.getByText(bodyText)).toBeVisible()

    //
    // Delete the node.
    //
    await atkCommands.deleteNodeViaUiWithNid(page, context, nid)
    tmpNid.splice(tmpNid.indexOf(nid), 1)
  })

  //
  // Create an article with an image, confirm it, update it, confirm update
  // then delete it via the UI.
  //
  test('(ATK-PW-1111) Create, update, delete an article via the UI. @ATK-PW-1111 @node @smoke @alters-db', async ({ page, context }) => {
    const testId = 'ATK-PW-1111'
    const image1Filepath = 'tests/data/NewspaperArticle.jpg'
    const uniqueToken1 = atkUtilities.createRandomString(6)
    let bodyText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean a ultrices tortor.'

    // Log in with the administrator account.
    // You should change this to an account other than the administrator,
    // which has all rights.
    await atkCommands.logInViaForm(page, context, qaUserAccounts.admin)

    //
    // Add an article.
    //
    await page.goto(baseUrl + atkConfig.articleAddUrl)

    // Fill in as many fields as you need here.
    const titleTextField = await page.locator('input[name="title[0][value]"]')
    await titleTextField.fill(`${testId}: A Title`)

    // Upload image.
    await page.setInputFiles('#edit-field-image-0-upload', image1Filepath)
    const altField = page.locator('input[name="field_image[0][alt]"]')
    await altField.fill(`${testId}: ${uniqueToken1}`)

    // Use these two lines for older versions of Drupal.
    // let ckEditor = await page.locator('[aria-label="Editor editing area: main"]')
    // await ckEditor.fill(bodyText)
    await atkCommands.inputTextIntoCKEditor(page, bodyText)

    await page.getByRole('button', { name: 'Save' }).first().click()

    //
    // Confirm content appears.
    //
    await expect(page.getByText(bodyText)).toBeVisible()

    const nid = await atkCommands.getNid(page)
    tmpNid.push(nid)

    //
    // Update the node.
    //
    bodyText = 'Ut eget ex vitae nibh dapibus vulputate ut id lacus.'

    const pageEditUrl = atkConfig.nodeEditUrl.replace('{nid}', `${nid}`)
    await page.goto(pageEditUrl)
    // Use these two lines for older versions of Drupal.
    // ckEditor = await page.locator('[aria-label="Editor editing area: main"]')
    // await ckEditor.fill(bodyText)
    await atkCommands.inputTextIntoCKEditor(page, bodyText)

    // Timeouts necessary when running at full speed.
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Save' }).first().click()
    await page.waitForTimeout(1000)

    //
    // Confirm content has changed.
    //
    await expect(page.getByText(bodyText)).toBeVisible()

    //
    // Delete the node.
    //
    await atkCommands.deleteNodeViaUiWithNid(page, context, nid)
    tmpNid.splice(tmpNid.indexOf(nid), 1)
  })

  test.afterAll(() => {
    tmpNid.forEach((nid) => {
      atkCommands.deleteNodeWithNid(nid)
    })
  })
})
