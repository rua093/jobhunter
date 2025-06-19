#!/usr/bin/env node

const TestHelper = require('../test/utils/test-helper');
const assert = require('assert');
const path = require('path');
const { By } = require('selenium-webdriver');

async function debugTestCase8() {
    let testHelper;
    try {
        console.log('🔍 Debug chi tiết Test Case 8: Ứng tuyển với file CV rỗng\n');

        // Bước 1: Khởi tạo driver
        console.log('📋 BƯỚC 1: Khởi tạo driver...');
        testHelper = new TestHelper();
        await testHelper.setupDriver();
        console.log('✅ Driver đã được khởi tạo thành công\n');

        // Bước 2: Đăng nhập
        console.log('📋 BƯỚC 2: Đăng nhập...');
        await testHelper.login(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD);
        console.log('✅ Đăng nhập thành công\n');

        // Bước 3: Điều hướng đến trang chi tiết công việc
        console.log('📋 BƯỚC 3: Điều hướng đến trang chi tiết công việc...');
        await testHelper.navigateToJobDetail(process.env.TEST_JOB_ID || '1', process.env.TEST_JOB_SLUG);
        let currentUrl = await testHelper.driver.getCurrentUrl();
        console.log(`📍 URL trang chi tiết: ${currentUrl}`);
        console.log('✅ Điều hướng thành công\n');

        // Bước 4: Nhấp vào nút ứng tuyển
        console.log('📋 BƯỚC 4: Nhấp vào nút ứng tuyển...');
        await testHelper.clickApplyButton();
        console.log('✅ Đã nhấp nút ứng tuyển\n');

        // Bước 5: Tạo file CV rỗng
        console.log('📋 BƯỚC 5: Tạo file CV rỗng...');
        const emptyCVPath = path.resolve(__dirname, './test-files/empty-cv.pdf');
        await testHelper.createTestFile(emptyCVPath, '');
        console.log(`📍 File CV rỗng đã tạo: ${emptyCVPath}`);
        console.log('✅ Tạo file CV rỗng thành công\n');

        // Bước 6: Thử tải lên CV rỗng
        console.log('📋 BƯỚC 6: Thử tải lên CV rỗng...');
        await testHelper.uploadCV(emptyCVPath, true);
        console.log('✅ Đã gửi file CV rỗng lên hệ thống\n');

        // Bước 7: Chờ thông báo lỗi
        console.log('📋 BƯỚC 7: Chờ thông báo lỗi...');
        await testHelper.waitForElement('.ant-message-error', 10000);
        const errorMessage = await testHelper.driver.findElement(By.css('.ant-message-error'));
        // Chờ message lỗi có text khác rỗng (tối đa 2s)
        let messageText = '';
        for (let i = 0; i < 10; i++) {
            messageText = await errorMessage.getText();
            if (messageText && messageText.trim()) break;
            await new Promise(r => setTimeout(r, 200));
        }
        console.log(`📍 Nội dung thông báo lỗi: "${messageText}"`);
        assert.ok(messageText.includes('File bị rỗng!'));
        console.log('✅ Đã xác minh thông báo lỗi đúng\n');

        // Bước 8: Xác minh file không được tải lên
        console.log('📋 BƯỚC 8: Xác minh file không được tải lên...');
        const uploadedFile = await testHelper.isElementPresent('.ant-upload-list-item-done');
        assert.strictEqual(uploadedFile, false);
        console.log('✅ File không được tải lên (không có .ant-upload-list-item-done)\n');

        console.log('🎉 TEST CASE 8 ĐÃ HOÀN THÀNH THÀNH CÔNG!');
    } catch (error) {
        console.log('\n❌ TEST CASE 8 THẤT BẠI!');
        console.log('🔍 Lỗi chi tiết:', error.message);
        console.log('📋 Stack trace:', error.stack);
        if (testHelper && testHelper.driver) {
            try {
                await testHelper.takeScreenshot('testcase8-error');
                console.log('📸 Đã chụp ảnh lỗi: testcase8-error.png');
            } catch (screenshotError) {
                console.log('❌ Không thể chụp ảnh lỗi:', screenshotError.message);
            }
        }
    } finally {
        if (testHelper && testHelper.driver) {
            console.log('\n🧹 Dọn dẹp...');
            await testHelper.teardownDriver();
            await testHelper.cleanupTestFiles();
            console.log('✅ Đã dọn dẹp xong');
        }
    }
}

debugTestCase8().catch(console.error); 