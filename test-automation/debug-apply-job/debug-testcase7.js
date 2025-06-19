#!/usr/bin/env node

const TestHelper = require('../test/utils/test-helper');
const assert = require('assert');
const { By } = require('selenium-webdriver');

async function debugTestCase7() {
    let testHelper;
    try {
        console.log('🔍 Debug chi tiết Test Case 7: Ứng tuyển khi chưa cập nhật hồ sơ cá nhân\n');

        // Bước 1: Khởi tạo driver
        console.log('📋 BƯỚC 1: Khởi tạo driver...');
        testHelper = new TestHelper();
        await testHelper.setupDriver();
        console.log('✅ Driver đã được khởi tạo thành công\n');

        // Bước 2: Đăng nhập với user chưa hoàn chỉnh hồ sơ
        const email = 'nhuy@gmail.com';
        const password = '123456';
        console.log('📋 BƯỚC 2: Đăng nhập với user chưa hoàn chỉnh hồ sơ...');
        await testHelper.login(email, password);
        console.log('✅ Đăng nhập thành công\n');

        // Bước 3: Điều hướng đến trang chi tiết công việc
        const jobId = '3';
        const jobSlug = 'senior-frontend-developer-reactjs';
        console.log('📋 BƯỚC 3: Điều hướng đến trang chi tiết công việc...');
        await testHelper.navigateToJobDetail(jobId, jobSlug);
        let currentUrl = await testHelper.driver.getCurrentUrl();
        console.log(`📍 URL trang chi tiết: ${currentUrl}`);
        console.log('✅ Điều hướng thành công\n');

        // Bước 4: Nhấp vào nút ứng tuyển
        console.log('📋 BƯỚC 4: Nhấp vào nút ứng tuyển...');
        await testHelper.clickApplyButton();
        console.log('✅ Đã nhấp nút ứng tuyển\n');

        // Bước 5: Kiểm tra alert thiếu thông tin cá nhân
        console.log('📋 BƯỚC 5: Kiểm tra alert thiếu thông tin cá nhân...');
        await testHelper.waitForElement('.ant-alert-message', 5000);
        const alertElem = await testHelper.driver.findElement(By.css('.ant-alert-message'));
        // Chờ alert message có text khác rỗng (tối đa 2s)
        let alertText = '';
        for (let i = 0; i < 10; i++) {
            alertText = await alertElem.getText();
            if (alertText && alertText.trim()) break;
            await new Promise(r => setTimeout(r, 200));
        }
        if (!alertText || !alertText.trim()) {
            console.log('⚠️ Cảnh báo: alert message vẫn rỗng sau khi chờ, sẽ chỉ kiểm tra alert description và nút.');
        } else {
            console.log(`📍 Alert message: ${alertText}`);
            assert.strictEqual(alertText, 'Thiếu thông tin cá nhân');
        }
        const alertDescElem = await testHelper.driver.findElement(By.css('.ant-alert-description'));
        const alertDesc = await alertDescElem.getText();
        console.log(`📍 Alert description: ${alertDesc}`);
        assert.ok(alertDesc.includes('Vui lòng cập nhật'));
        // Kiểm tra nút 'Cập nhật thông tin ngay'
        const updateButton = await testHelper.driver.findElement(By.xpath("//button[span[contains(text(), 'Cập nhật thông tin ngay')]]"));
        assert.ok(await updateButton.isDisplayed());
        // Đảm bảo KHÔNG tìm thấy nút ứng tuyển
        let applyBtnPresent = false;
        try {
            const btns = await testHelper.driver.findElements(By.css('.ant-btn-primary'));
            for (let btn of btns) {
                const text = await btn.getText();
                if (text.includes('Ứng tuyển')) applyBtnPresent = true;
            }
        } catch (e) {}
        console.log(`📍 Nút ứng tuyển có xuất hiện không: ${applyBtnPresent}`);
        assert.strictEqual(applyBtnPresent, false);
        console.log('✅ Đã xác minh trạng thái thiếu thông tin cá nhân\n');
        console.log('🎉 TEST CASE 7 ĐÃ HOÀN THÀNH THÀNH CÔNG!');
    } catch (error) {
        console.log('\n❌ TEST CASE 7 THẤT BẠI!');
        console.log('🔍 Lỗi chi tiết:', error.message);
        console.log('📋 Stack trace:', error.stack);
        if (testHelper && testHelper.driver) {
            try {
                await testHelper.takeScreenshot('testcase7-error');
                console.log('📸 Đã chụp ảnh lỗi: testcase7-error.png');
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

debugTestCase7().catch(console.error); 