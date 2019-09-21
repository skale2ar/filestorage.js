let webdriver = require('selenium-webdriver');
let Filestorage = require('../src/index');
let fs = require('fs');
let path = require('path');
require('dotenv').config();

// eslint-disable-next-line
let chrome = require('chromedriver');

const chai = require('chai');
const assert = chai.assert;
chai.should();
chai.use(require('chai-as-promised'));

describe('Browser integration', async function () {
    let htmlPage;
    let driver;
    let downloadDir;
    before(async function () {
        downloadDir = path.join(__dirname, 'downloadedFiles');
        htmlPage = path.join('file:///', __dirname, 'test.html');
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir);
        }
        let chromeCapabilities = webdriver.Capabilities.chrome();
        let chromeOptions = {
            'args': ['--test-type', '--start-maximized', '--no-sandbox']
        };
        chromeCapabilities.set('chromeOptions', chromeOptions);
        driver = new webdriver.Builder()
            .withCapabilities(chromeCapabilities)
            .build();
        await driver.setDownloadPath(downloadDir);
    });

    describe('downloadToFile', async function () {
        let fileName = 'testFile';
        let endpoint = process.env.SKALE_ENDPOINT;
        let address = process.env.ADDRESS;
        let data = Buffer.from(fileName);
        let storagePath;
        let filestorage;
        let pathToFile;
        before(async function () {
            pathToFile = path.join(downloadDir, fileName);
            filestorage = new Filestorage(endpoint);
            storagePath = await filestorage.uploadFile(address, fileName, data, process.env.PRIVATEKEY);
            driver.get(htmlPage);
        });

        it('should download file from fs to local', async function () {
            await driver.findElement(webdriver.By.id('SCHAIN_ENDPOINT')).sendKeys(endpoint);
            await driver.findElement(webdriver.By.id('storagePath')).sendKeys(storagePath);
            await driver.findElement(webdriver.By.id('downloadFile')).click();
            await driver.wait(webdriver.until.titleIs('Downloaded'), 100000);
            await driver.sleep(2000);
            assert.isTrue(fs.existsSync(pathToFile), 'File is not downloaded');
            assert.isTrue(Buffer.compare(fs.readFileSync(pathToFile), data) === 0, 'File content is differ');
        });

        after(async function () {
            await driver.quit();
            await filestorage.deleteFile(address, fileName, process.env.PRIVATEKEY);
            fs.unlinkSync(pathToFile);
        });
    });

    after(async function () {
        fs.rmdirSync(downloadDir);
    });
});
