import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { expect } from 'chai';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const {
  MONGO_URI,
  EMAIL_OTP_COLLECTION,
  PHONE_OTP_COLLECTION,
  BASE_URL
} = process.env;

async function fetchLatestOtp(collection, identifier) {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const doc = await db
    .collection(collection)
    .findOne({ to: identifier }, { sort: { createdAt: -1 } });
  await client.close();
  return doc?.otp;
}

describe('Signup Flow Test on ' + BASE_URL, function () {
  this.timeout(90000);
  let driver;

  before(async () => {
    const options = new chrome.Options();
    options.addArguments('--headless', '--disable-gpu', '--no-sandbox');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should complete signup flow with OTP verification', async () => {
    await driver.get(BASE_URL);
    const header = await driver.findElement(By.css('h1'));
    expect(await header.getText()).to.include('Partner :: MySquard'); // Adjust text as needed

    // 1. Email OTP
    const testEmail = 'user@example.com';
    await driver.findElement(By.id('exampleEmail')).sendKeys(testEmail);
    await driver.findElement(By.xpath("//button[@class='sc-1f4d4914-23 shefB']")).click();

    await driver.wait(until.elementLocated(By.name('emailOtp')), 10000);
    const emailOtp = await fetchLatestOtp(EMAIL_OTP_COLLECTION, testEmail);
    expect(emailOtp).to.match(/^\d{4,6}$/); // OTP format validation
    await driver.findElement(By.name('emailOtp')).sendKeys(emailOtp);

    // 2. Phone OTP
    const testPhone = '+15551234567';
    await driver.findElement(By.name('phone')).sendKeys(testPhone);
    await driver.findElement(By.id('phone-otp-button')).click();

    await driver.wait(until.elementLocated(By.name('phoneOtp')), 10000);
    const phoneOtp = await fetchLatestOtp(PHONE_OTP_COLLECTION, testPhone);
    expect(phoneOtp).to.match(/^\d{4,6}$/);
    await driver.findElement(By.name('phoneOtp')).sendKeys(phoneOtp);

    // 3. Partner Type
    await driver.findElement(By.css('input[name="partnerType"][value="Individual"]')).click();

    // 4. Individual flow
    const first = 'John', last = 'Doe';
    await driver.findElement(By.name('firstName')).sendKeys(first);
    await driver.findElement(By.name('lastName')).sendKeys(last);
    await driver.findElement(By.name('dob')).sendKeys('01011990'); // mmddyyyy format

    // 5. SSN last 4 digits
    await driver.findElement(By.name('ssnLast4')).sendKeys('1234');

    // 6. Address details
    await driver.findElement(By.name('addressLine1')).sendKeys('123 Main St');
    await driver.findElement(By.name('city')).sendKeys('Springfield');
    await driver.findElement(By.name('state')).sendKeys('IL');
    await driver.findElement(By.name('zip')).sendKeys('62704');

    // 7. Agree T&C
    await driver.findElement(By.name('agreeTnc')).click();

    // 8. Upload documents
    const fileInput = await driver.findElement(By.name('profileImage'));
    await fileInput.sendKeys('/path/to/profile.jpg');

    await driver.findElement(By.name('driversLicense')).sendKeys('/path/to/dl.jpg');
    await driver.findElement(By.name('photoId')).sendKeys('/path/to/photo_id.jpg');

    // 9. Bank details (Debit Card only)
    await driver.findElement(By.name('cardNumber')).sendKeys('4111111111111111');
    await driver.findElement(By.name('expDate')).sendKeys('1225');
    await driver.findElement(By.name('cvv')).sendKeys('123');
    await driver.findElement(By.name('submit')).click();

    // 10. Final success verification
    await driver.wait(until.elementLocated(By.css('.welcome-message')), 15000);
    const welcome = await driver.findElement(By.css('.welcome-message')).getText();
    expect(welcome).to.include('Welcome, John'); // adjust as per app
  });
});
