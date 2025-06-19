#!/usr/bin/env node

const TestHelper = require('../test/utils/test-helper');
const assert = require('assert');
const path = require('path');
const { By } = require('selenium-webdriver');

async function debugTestCase6() {
    let testHelper;
    try {
        console.log('🔍 Debug chi tiết Test Case 6: Ứng tuyển công việc đã ứng tuyển trước đó\n');

        // Bước 1: Khởi tạo driver
        console.log('📋 BƯỚC 1: Khởi tạo driver...');
        testHelper = new TestHelper();
        await testHelper.setupDriver();
        console.log('✅ Driver đã được khởi tạo thành công\n');

        // Bước 2: Kiểm tra biến môi trường
        console.log('📋 BƯỚC 2: Kiểm tra biến môi trường...');
        console.log(`📍 BASE_URL: ${process.env.BASE_URL || 'http://localhost:3000'}`);
        console.log(`📍 TEST_USER_EMAIL: ${process.env.TEST_USER_EMAIL || 'CHƯA SET'}`);
        console.log(`📍 TEST_USER_PASSWORD: ${process.env.TEST_USER_PASSWORD ? 'ĐÃ SET' : 'CHƯA SET'}`);
        console.log(`📍 TEST_JOB_ID: ${process.env.TEST_JOB_ID || '1'}`);
        console.log(`📍 TEST_JOB_SLUG: ${process.env.TEST_JOB_SLUG || 'CHƯA SET'}`);
        console.log('✅ Biến môi trường OK\n');

        // Bước 3: Đăng nhập
        console.log('📋 BƯỚC 3: Đăng nhập...');
        await testHelper.login(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD);
        console.log('✅ Đăng nhập thành công\n');

        // Bước 4: Điều hướng đến trang chi tiết công việc
        console.log('📋 BƯỚC 4: Điều hướng đến trang chi tiết công việc...');
        await testHelper.navigateToJobDetail(process.env.TEST_JOB_ID || '1', process.env.TEST_JOB_SLUG);
        let currentUrl = await testHelper.driver.getCurrentUrl();
        console.log(`📍 URL trang chi tiết: ${currentUrl}`);
        console.log('✅ Điều hướng thành công\n');

        // Bước 5: Nhấp vào nút ứng tuyển
        console.log('📋 BƯỚC 5: Nhấp vào nút ứng tuyển...');
        await testHelper.clickApplyButton();
        console.log('✅ Đã nhấp nút ứng tuyển\n');

        // Bước 6: Kiểm tra thông báo đã ứng tuyển
        console.log('📋 BƯỚC 6: Kiểm tra thông báo đã ứng tuyển...');
        // Chờ alert xuất hiện
        await testHelper.waitForElement('.ant-alert-message', 5000);
        const alertElem = await testHelper.driver.findElement(By.css('.ant-alert-message'));
        const alertText = await alertElem.getText();
        const alertDescElem = await testHelper.driver.findElement(By.css('.ant-alert-description'));
        const alertDesc = await alertDescElem.getText();
        console.log(`📍 Alert message: ${alertText}`);
        console.log(`📍 Alert description: ${alertDesc}`);
        assert.strictEqual(alertText, 'Đã ứng tuyển');
        assert.strictEqual(alertDesc, 'Bạn đã ứng tuyển công việc này rồi.');
        // Kiểm tra nút ứng tuyển
        const applyButton = await testHelper.driver.findElement(By.css('.ant-btn-primary'));
        const isDisabled = await applyButton.getAttribute('disabled');
        const buttonText = await applyButton.getText();
        console.log(`📍 Nút ứng tuyển: text='${buttonText}', disabled=${isDisabled}`);
        assert.ok(isDisabled);
        assert.strictEqual(buttonText, 'Đã ứng tuyển');
        console.log('✅ Đã xác minh trạng thái "Đã ứng tuyển"\n');
        console.log('🎉 TEST CASE 6 ĐÃ HOÀN THÀNH THÀNH CÔNG!');
    } catch (error) {
        console.log('\n❌ TEST CASE 6 THẤT BẠI!');
        console.log('🔍 Lỗi chi tiết:', error.message);
        console.log('📋 Stack trace:', error.stack);
        // Chụp ảnh lỗi
        if (testHelper && testHelper.driver) {
            try {
                await testHelper.takeScreenshot('testcase6-error');
                console.log('📸 Đã chụp ảnh lỗi: testcase6-error.png');
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

debugTestCase6().catch(console.error); 