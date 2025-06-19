const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

class TestHelper {
    constructor() {
        this.driver = null;
        this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    }

    async setupDriver() {
        const options = new chrome.Options();
        
        if (process.env.HEADLESS === 'true') {
            options.addArguments('--headless');
        }
        
        // Các thiết lập tối ưu khi chạy ChromeDriver
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');
    
        options.addArguments('--incognito');
        
        // Tối ưu hóa hiệu suất
        options.addArguments('--disable-extensions');
        options.addArguments('--disable-plugins');
        options.addArguments('--disable-images'); // Tắt load hình ảnh để tăng tốc
        options.addArguments('--disable-javascript-harmony-shipping');
        options.addArguments('--disable-background-timer-throttling');
        options.addArguments('--disable-backgrounding-occluded-windows');
        options.addArguments('--disable-renderer-backgrounding');
        options.addArguments('--disable-features=TranslateUI');
        options.addArguments('--disable-ipc-flooding-protection');

        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        await this.driver.manage().setTimeouts({ implicit: 5000 });
        await this.driver.manage().window().maximize();
    }

    async teardownDriver() {
        if (this.driver) {
            await this.driver.quit();
        }
    }

    async login(email, password) {
        await this.driver.get(`${this.baseUrl}/login`);
        
        // Fill login form
        await this.driver.findElement(By.id('basic_username')).sendKeys(email);
        await this.driver.findElement(By.id('basic_password')).sendKeys(password);
        
        // Click login button
        await this.driver.findElement(By.css('button[type="submit"]')).click();
        
        // Wait for redirect - thử nhiều URL có thể
        try {
            await this.driver.wait(until.urlContains('/home'), 5000);
        } catch (error) {
            try {
                await this.driver.wait(until.urlContains('/dashboard'), 5000);
            } catch (error2) {
                try {
                    await this.driver.wait(until.urlContains('/'), 5000);
                } catch (error3) {
                    // Nếu không redirect, kiểm tra xem có thông báo lỗi không
                    const currentUrl = await this.driver.getCurrentUrl();
                    if (currentUrl.includes('/login')) {
                        throw new Error('Đăng nhập thất bại - vẫn ở trang login');
                    }
                }
            }
        }
    }

    async logout() {
        // Click on user menu and logout
        await this.driver.findElement(By.css('.user-menu')).click();
        await this.driver.findElement(By.css('.logout-btn')).click();
        
        // Wait for redirect to login page
        await this.driver.wait(until.urlContains('/login'), 10000);
    }

    async navigateToJobDetail(jobId, jobSlug) {
        await this.driver.get(`${this.baseUrl}/job/${jobSlug}?id=${jobId}`);
        
        // Chờ trang load với selector đơn giản và timeout ngắn hơn
        try {
            // Thử tìm nút ứng tuyển trước (element quan trọng nhất)
            await this.driver.wait(until.elementLocated(By.xpath("//button[text()='Ứng tuyển ngay']")), 3000);
        } catch (error) {
            try {
                // Thử tìm tiêu đề công việc
                await this.driver.wait(until.elementLocated(By.css('h1, h2, .job-title')), 3000);
            } catch (error2) {
                try {
                    // Thử tìm bất kỳ element nào chứa thông tin job
                    await this.driver.wait(until.elementLocated(By.css('.job-detail, .detail-job-section')), 3000);
                } catch (error3) {
                    // Nếu không tìm thấy, vẫn tiếp tục nhưng log cảnh báo
                    console.log('⚠️ Không tìm thấy element trang chi tiết, nhưng vẫn tiếp tục...');
                }
            }
        }
    }

    async clickApplyButton() {
        const applyButton = await this.driver.findElement(By.xpath("//button[text()='Ứng tuyển ngay']"));
        await applyButton.click();
        
        // Wait for modal to appear
        await this.driver.wait(until.elementLocated(By.xpath("//*[contains(@class, 'ant-modal-content')]")), 10000);
    }

    async uploadCV(filePath, skipWaitDone = false) {
        const fileInput = await this.driver.findElement(By.css('input[type="file"]'));
        await fileInput.sendKeys(filePath);
        
        // Chỉ chờ upload thành công nếu không skip
        if (!skipWaitDone) {
        await this.driver.wait(until.elementLocated(By.css('.ant-upload-list-item-done')), 15000);
        }
    }

    async getAlertMessage() {
        try {
            const alert = await this.driver.findElement(By.css('.ant-alert-message'));
            return await alert.getText();
        } catch (error) {
            return null;
        }
    }

    async getModalTitle() {
        // Chờ modal title xuất hiện và có nội dung
        await this.driver.wait(until.elementLocated(By.css('.ant-modal-title')), 10000);
        
        // Chờ thêm một chút để đảm bảo text đã load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const modalTitle = await this.driver.findElement(By.css('.ant-modal-title'));
        const titleText = await modalTitle.getText();
        
        // Nếu title rỗng, thử lại sau 1 giây
        if (!titleText.trim()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const retryTitle = await this.driver.findElement(By.css('.ant-modal-title'));
            return await retryTitle.getText();
        }
        
        return titleText;
    }

    async isElementPresent(selector) {
        try {
            await this.driver.findElement(By.css(selector));
            return true;
        } catch (error) {
            return false;
        }
    }

    async waitForElement(selector, timeout = 10000) {
        await this.driver.wait(until.elementLocated(By.css(selector)), timeout);
    }

    async takeScreenshot(filename) {
        const screenshot = await this.driver.takeScreenshot();
        const fs = require('fs');
        const path = require('path');
        
        const screenshotDir = path.join(__dirname, '../screenshots');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(screenshotDir, `${filename}.png`), screenshot, 'base64');
    }

    async createTestFile(filePath, content, size = null) {
        const fs = require('fs');
        const path = require('path');
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (size) {
            // Create file with specific size
            const buffer = Buffer.alloc(size);
            fs.writeFileSync(filePath, buffer);
        } else {
            // Create file with content
            fs.writeFileSync(filePath, content);
        }
    }

    async cleanupTestFiles() {
        const fs = require('fs');
        const path = require('path');
        const testFilesDir = path.join(__dirname, '../test-files');
        
        if (fs.existsSync(testFilesDir)) {
            const files = fs.readdirSync(testFilesDir);
            for (const file of files) {
                fs.unlinkSync(path.join(testFilesDir, file));
            }
        }
    }
}

module.exports = TestHelper; 