#!/usr/bin/env node

const TestHelper = require('../test/utils/test-helper');
const assert = require('assert');
const path = require('path');
const { By, until } = require('selenium-webdriver');

async function debugTestCase1() {
    let testHelper;
    
    try {
        console.log('🔍 Debug chi tiết Test Case 1: Ứng tuyển thành công với hồ sơ hợp lệ\n');
        
        // Bước 1: Khởi tạo driver
        console.log('📋 BƯỚC 1: Khởi tạo driver...');
        testHelper = new TestHelper();
        await testHelper.setupDriver();
        console.log('✅ Driver đã được khởi tạo thành công\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Bước 2: Kiểm tra biến môi trường
        console.log('📋 BƯỚC 2: Kiểm tra biến môi trường...');
        console.log(`📍 BASE_URL: ${process.env.BASE_URL || 'http://localhost:3000'}`);
        console.log(`📍 TEST_USER_EMAIL: ${process.env.TEST_USER_EMAIL || 'CHƯA SET'}`);
        console.log(`📍 TEST_USER_PASSWORD: ${process.env.TEST_USER_PASSWORD ? 'ĐÃ SET' : 'CHƯA SET'}`);
        console.log(`📍 TEST_JOB_ID: ${process.env.TEST_JOB_ID || '1'}`);
        console.log(`📍 TEST_JOB_SLUG: ${process.env.TEST_JOB_SLUG || 'CHƯA SET'}`);
        console.log('✅ Biến môi trường OK\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Bước 3: Điều hướng đến trang chủ
        console.log('📋 BƯỚC 3: Điều hướng đến trang chủ...');
        await testHelper.driver.get(testHelper.baseUrl);
        let currentUrl = await testHelper.driver.getCurrentUrl();
        console.log(`📍 URL hiện tại: ${currentUrl}`);
        console.log('✅ Điều hướng trang chủ thành công\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Bước 4: Đăng nhập với thông tin hợp lệ
        console.log('📋 BƯỚC 4: Đăng nhập với thông tin hợp lệ...');
        try {
            await testHelper.login(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD);
            currentUrl = await testHelper.driver.getCurrentUrl();
            console.log(`📍 URL sau đăng nhập: ${currentUrl}`);
            console.log('✅ Đăng nhập thành công\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('❌ LỖI: Đăng nhập thất bại');
            console.log('🔍 Lỗi chi tiết:', error.message);
            throw error;
        }
        
        // Bước 5: Điều hướng đến trang chi tiết công việc
        console.log('📋 BƯỚC 5: Điều hướng đến trang chi tiết công việc...');
        try {
            await testHelper.navigateToJobDetail(process.env.TEST_JOB_ID || '1', process.env.TEST_JOB_SLUG);
            currentUrl = await testHelper.driver.getCurrentUrl();
            console.log(`📍 URL trang chi tiết: ${currentUrl}`);
            console.log('✅ Điều hướng trang chi tiết thành công\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('❌ LỖI: Không thể điều hướng đến trang chi tiết');
            console.log('🔍 Lỗi chi tiết:', error.message);
            throw error;
        }
        
        // Bước 6: Nhấp vào nút ứng tuyển
        console.log('📋 BƯỚC 6: Nhấp vào nút ứng tuyển...');
        try {
            await testHelper.clickApplyButton();
            console.log('✅ Nhấp nút ứng tuyển thành công\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('❌ LỖI: Không thể nhấp nút ứng tuyển');
            console.log('🔍 Lỗi chi tiết:', error.message);
            throw error;
        }
        
        // Bước 7: Xác minh tiêu đề modal
        console.log('📋 BƯỚC 7: Xác minh tiêu đề modal...');
        try {
            const modalTitle = await testHelper.getModalTitle();
            console.log(`📍 Tiêu đề modal: "${modalTitle}"`);
            assert.strictEqual(modalTitle, 'Ứng Tuyển Job');
            console.log('✅ Tiêu đề modal đúng\n');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Lấy thông tin tên công việc và công ty từ modal ứng tuyển
            const infoElem = await testHelper.driver.findElement(By.xpath("//p[contains(., 'Bạn đang ứng tuyển công việc')]"));
            const infoHtml = await infoElem.getAttribute('innerHTML');
            const matches = infoHtml.match(/<b>(.*?)<\/b> tại <b>(.*?)<\/b>/);
            assert.ok(matches && matches.length === 3, 'Không lấy được tên công việc và công ty');
            var jobName = matches[1].trim();
            var companyName = matches[2].trim();
        } catch (error) {
            console.log('❌ LỖI: Tiêu đề modal không đúng hoặc không lấy được thông tin job/company');
            console.log('🔍 Lỗi chi tiết:', error.message);
            throw error;
        }
        
        // Bước 8: Tạo file CV hợp lệ
        console.log('📋 BƯỚC 8: Tạo file CV hợp lệ...');
        try {
            const validCVPath = path.resolve(__dirname, './test-files/valid-cv.pdf');
            await testHelper.createTestFile(validCVPath, 'Đây là nội dung CV hợp lệ');
            console.log(`📍 File CV đã tạo: ${validCVPath}`);
            console.log('✅ Tạo file CV thành công\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('❌ LỖI: Không thể tạo file CV');
            console.log('🔍 Lỗi chi tiết:', error.message);
            throw error;
        }
        
        // Bước 9: Tải lên CV
        console.log('📋 BƯỚC 9: Tải lên CV...');
        try {
            const validCVPath = path.resolve(__dirname, './test-files/valid-cv.pdf');
            await testHelper.uploadCV(validCVPath);
            // Kiểm tra thông báo upload thành công
            await testHelper.waitForElement('.ant-message-success', 10000);
            let uploadMsgText = '';
            for (let i = 0; i < 10; i++) {
                const uploadMsgElem = await testHelper.driver.findElement(By.css('.ant-message-success'));
                uploadMsgText = await uploadMsgElem.getText();
                if (uploadMsgText && uploadMsgText.includes('đã tải lên thành công')) break;
                await new Promise(r => setTimeout(r, 200));
            }
            console.log(`📍 Thông báo upload: "${uploadMsgText}"`);
            assert.ok(uploadMsgText.includes('đã tải lên thành công'));
            console.log('✅ Tải lên CV thành công và có thông báo đúng\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('❌ LỖI: Không thể tải lên CV hoặc không có thông báo đúng');
            console.log('🔍 Lỗi chi tiết:', error.message);
            throw error;
        }
        
        // Bước 10: Nhấp vào nút ứng tuyển trong modal
        console.log('📋 BƯỚC 10: Nhấp vào nút ứng tuyển trong modal...');
        try {
            const applyButton = await testHelper.driver.findElement(By.css('.ant-btn-primary'));
            await applyButton.click();
            // Kiểm tra thông báo ứng tuyển thành công
            await testHelper.waitForElement('.ant-message-success', 10000);
            let applyMsgText = '';
            for (let i = 0; i < 15; i++) {
                const applyMsgElem = await testHelper.driver.findElement(By.css('.ant-message-success'));
                applyMsgText = await applyMsgElem.getText();
                if (applyMsgText && applyMsgText.includes('Ứng tuyển thành công')) break;
                await new Promise(r => setTimeout(r, 200));
            }
            console.log(`📍 Thông báo ứng tuyển: "${applyMsgText}"`);
            assert.ok(applyMsgText.includes('Ứng tuyển thành công'));
            console.log('✅ Ứng tuyển thành công và có thông báo đúng\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('❌ LỖI: Không thể nhấp nút ứng tuyển trong modal hoặc không có thông báo đúng');
            console.log('🔍 Lỗi chi tiết:', error.message);
            throw error;
        }

        // Bước 11: Chờ 2 giây để backend cập nhật và frontend load lại
        console.log('📋 BƯỚC 11: Chờ 2 giây để cập nhật dữ liệu và modal đóng hẳn...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Đã chờ 2 giây\n');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Bước 12: (BỎ QUA - không kiểm tra lại thông báo thành công)

        // Bước 13: Kiểm tra công việc đã xuất hiện trong modal quản lý tài khoản...
        console.log('📋 BƯỚC 13: Kiểm tra công việc đã xuất hiện trong modal quản lý tài khoản...');
        try {
            // Mở modal quản lý tài khoản
            await testHelper.driver.findElement(By.css('.ant-avatar')).click();
            await testHelper.driver.findElement(By.xpath("//li[contains(@class, 'ant-dropdown-menu-item')]//label[text()='Quản lý tài khoản']")).click();
            await testHelper.waitForElement('.ant-modal-title');
            // Lấy dòng cuối cùng của bảng Rải CV
            const rows = await testHelper.driver.findElements(By.css('.ant-table-tbody > tr'));
            assert.ok(rows.length > 0, 'Không có dòng nào trong bảng Rải CV');
            const lastRow = rows[rows.length - 1];
            const cells = await lastRow.findElements(By.css('td'));
            const companyCellText = await cells[1].getText(); // Cột "Công Ty"
            const jobCellText = await cells[2].getText();     // Cột "Job title"
            assert.strictEqual(companyCellText.trim(), companyName, 'Tên công ty không khớp');
            assert.strictEqual(jobCellText.trim(), jobName, 'Tên công việc không khớp');
            console.log('✅ Công việc vừa ứng tuyển đã xuất hiện trong modal quản lý tài khoản\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log('❌ LỖI: Công việc vừa ứng tuyển không xuất hiện trong modal quản lý tài khoản');
            console.log('🔍 Lỗi chi tiết:', error.message);
            throw error;
        }
        
        console.log('🎉 TẤT CẢ CÁC BƯỚC ĐÃ HOÀN THÀNH THÀNH CÔNG!');
        console.log('✅ Test Case 1: Ứng tuyển thành công với hồ sơ hợp lệ - PASSED');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
    } catch (error) {
        console.log('\n❌ TEST CASE 1 THẤT BẠI!');
        console.log('🔍 Lỗi chi tiết:', error.message);
        console.log('📋 Stack trace:', error.stack);
        
        // Chụp ảnh lỗi
        if (testHelper && testHelper.driver) {
            try {
                await testHelper.takeScreenshot('testcase1-error');
                console.log('📸 Đã chụp ảnh lỗi: testcase1-error.png');
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

// Chạy debug
debugTestCase1().catch(console.error); 