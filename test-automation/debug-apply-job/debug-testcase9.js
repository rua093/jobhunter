#!/usr/bin/env node

const TestHelper = require('../test/utils/test-helper');
const assert = require('assert');
const path = require('path');
const { By } = require('selenium-webdriver');

async function debugTestCase9() {
    let testHelper;
    try {
        console.log('🔍 Debug chi tiết Test Case 9: Ứng tuyển khi kỹ năng và kinh nghiệm không phù hợp\n');

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
        const jobId = '4';
        const jobSlug = 'web-design-engineer-html-css-javascript';
        console.log('📋 BƯỚC 3: Điều hướng đến trang chi tiết công việc...');
        await testHelper.navigateToJobDetail(jobId, jobSlug);
        let currentUrl = await testHelper.driver.getCurrentUrl();
        console.log(`📍 URL trang chi tiết: ${currentUrl}`);
        console.log('✅ Điều hướng thành công\n');

        // Bước 4: Nhấp vào nút ứng tuyển
        console.log('📋 BƯỚC 4: Nhấp vào nút ứng tuyển...');
        await testHelper.clickApplyButton();
        console.log('✅ Đã nhấp nút ứng tuyển\n');

        // Bước 5: Kiểm tra alert "Thông tin không phù hợp"
        console.log('📋 BƯỚC 5: Kiểm tra alert "Thông tin không phù hợp"...');
        await testHelper.waitForElement('.ant-alert-message', 5000);
        const alertElem = await testHelper.driver.findElement(By.css('.ant-alert-message'));
        let alertText = '';
        for (let i = 0; i < 10; i++) {
            alertText = await alertElem.getText();
            if (alertText && alertText.trim()) break;
            await new Promise(r => setTimeout(r, 200));
        }
        console.log(`📍 Alert message: ${alertText}`);
        assert.strictEqual(alertText, 'Thông tin không phù hợp');
        const alertDescElem = await testHelper.driver.findElement(By.css('.ant-alert-description'));
        const alertDesc = await alertDescElem.getText();
        console.log(`📍 Alert description: ${alertDesc}`);
        assert.ok(alertDesc.includes('Kỹ năng hiện tại không phù hợp'));
        // Kiểm tra nút ứng tuyển vẫn enable
        const applyButton = await testHelper.driver.findElement(By.css('.ant-btn-primary'));
        const isDisabled = await applyButton.getAttribute('disabled');
        const buttonText = await applyButton.getText();
        console.log(`📍 Nút ứng tuyển: text='${buttonText}', disabled=${isDisabled}`);
        assert.strictEqual(isDisabled, null);
        assert.ok(buttonText.includes('Ứng tuyển'));

        // Bước 6: Tạo file CV hợp lệ và upload
        console.log('📋 BƯỚC 6: Tạo file CV hợp lệ và upload...');
        const validCVPath = path.resolve(__dirname, './test-files/valid-cv.pdf');
        await testHelper.createTestFile(validCVPath, 'Đây là nội dung CV hợp lệ');
        await testHelper.uploadCV(validCVPath);
        // Kiểm tra message upload thành công
        await testHelper.waitForElement('.ant-message-success', 10000);
        let uploadMessage = '';
        for (let i = 0; i < 10; i++) {
            const msgElem = await testHelper.driver.findElement(By.css('.ant-message-success'));
            uploadMessage = await msgElem.getText();
            if (uploadMessage && uploadMessage.trim()) break;
            await new Promise(r => setTimeout(r, 200));
        }
        console.log(`📍 Thông báo upload file: "${uploadMessage}"`);
        assert.ok(uploadMessage.includes('đã tải lên thành công'));
        console.log('✅ Đã xác minh upload file thành công\n');

        // Bước 7: Nhấp vào nút ứng tuyển (vẫn enable)
        console.log('📋 BƯỚC 7: Nhấp vào nút ứng tuyển (vẫn enable)...');
        await applyButton.click();
        console.log('✅ Đã nhấp nút ứng tuyển\n');

        // Bước 8: Kiểm tra modal cảnh báo
        console.log('📋 BƯỚC 8: Kiểm tra modal cảnh báo...');
        await testHelper.waitForElement('.ant-modal-confirm-title', 5000);
        const modalTitleElem = await testHelper.driver.findElement(By.css('.ant-modal-confirm-title'));
        let modalTitleText = '';
        for (let i = 0; i < 10; i++) {
            modalTitleText = await modalTitleElem.getText();
            if (modalTitleText && modalTitleText.trim()) break;
            await new Promise(r => setTimeout(r, 200));
        }
        console.log(`📍 Modal title: ${modalTitleText}`);
        const modalElem = await testHelper.driver.findElement(By.css('.ant-modal-content'));
        const modalAllText = await modalElem.getText();
        console.log(`📍 Toàn bộ nội dung modal:\n${modalAllText}`);
        assert.strictEqual(modalTitleText, 'Cảnh báo');
        const modalContent = await testHelper.driver.findElement(By.css('.ant-modal-confirm-content'));
        const modalContentText = await modalContent.getText();
        console.log(`📍 Modal content: ${modalContentText}`);
        assert.ok(modalContentText.includes('Kỹ năng không phù hợp'));
        // Bước 9: Nhấp vào nút "Tiếp tục ứng tuyển"
        console.log('📋 BƯỚC 9: Nhấp vào nút "Tiếp tục ứng tuyển"...');
        const continueBtn = await testHelper.driver.findElement(By.xpath("//button[span[contains(text(), 'Tiếp tục ứng tuyển')]]"));
        await continueBtn.click();
        console.log('✅ Đã nhấp nút "Tiếp tục ứng tuyển"\n');

        // Bước 10: Chờ thông báo ứng tuyển thành công
        console.log('📋 BƯỚC 10: Chờ thông báo ứng tuyển thành công...');
        // Chờ message mới xuất hiện (khác message upload)
        let applySuccess = false;
        let applyMessage = '';
        for (let i = 0; i < 15; i++) {
            const msgElems = await testHelper.driver.findElements(By.css('.ant-message-success'));
            for (let msgElem of msgElems) {
                const text = await msgElem.getText();
                if (text.includes('Ứng tuyển thành công')) {
                    applySuccess = true;
                    applyMessage = text;
                    break;
                }
            }
            if (applySuccess) break;
            await new Promise(r => setTimeout(r, 300));
        }
        if (applySuccess) {
            console.log(`📍 Thông báo ứng tuyển thành công: "${applyMessage}"`);
            console.log('✅ Đã xác minh ứng tuyển thành công\n');
        } else {
            console.log('❌ Không tìm thấy thông báo "Ứng tuyển thành công" sau khi bấm tiếp tục ứng tuyển!');
            // Log toàn bộ message success để debug
            const msgElems = await testHelper.driver.findElements(By.css('.ant-message-success'));
            for (let msgElem of msgElems) {
                const text = await msgElem.getText();
                console.log(`📍 Message success hiện có: "${text}"`);
            }
            throw new Error('Không tìm thấy thông báo "Ứng tuyển thành công"');
        }

        console.log('🎉 TEST CASE 9 ĐÃ HOÀN THÀNH THÀNH CÔNG!');
    } catch (error) {
        console.log('\n❌ TEST CASE 9 THẤT BẠI!');
        console.log('🔍 Lỗi chi tiết:', error.message);
        console.log('📋 Stack trace:', error.stack);
        if (testHelper && testHelper.driver) {
            try {
                await testHelper.takeScreenshot('testcase9-error');
                console.log('📸 Đã chụp ảnh lỗi: testcase9-error.png');
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

debugTestCase9().catch(console.error); 