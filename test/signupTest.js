import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { expect } from 'chai';

describe('MySquard Partner', function () {
  this.timeout(30000);

  let driver; // ⬅️ Declare in outer scope

  before(async () => {
    const options = new chrome.Options();
    options.addArguments('--headless', '--disable-gpu', '--no-sandbox');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('Open MySqaurd partner web app and verify title', async () => {
    await driver.get('https://p-dev.mysquard.com/');
    // const searchBox = await driver.findElement(By.name('q'));
    // await searchBox.sendKeys('OpenAI');
    // await searchBox.submit();
    await driver.wait(until.titleContains('Partner :: MySquard'), 10000);
    const title = await driver.getTitle();
    expect(title).to.include('Partner :: MySquard');
  });
});
