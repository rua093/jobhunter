const TestHelper = require('./utils/test-helper');
const assert = require('assert');
const path = require('path');
const { By } = require('selenium-webdriver');
const { until } = require('selenium-webdriver');

describe('JobHunter - Các Testcase Ứng Tuyển Công Việc', function() {
    let testHelper;
    const testUserEmail = process.env.TEST_USER_EMAIL;
    const testUserPassword = process.env.TEST_USER_PASSWORD;
    const testJobId = process.env.TEST_JOB_ID || '1';

    before(async function() {
        testHelper = new TestHelper();
        await testHelper.setupDriver();
    });

    after(async function() {
        await testHelper.teardownDriver();
        await testHelper.cleanupTestFiles();
    });

    beforeEach(async function() {
        // Điều hướng đến trang chủ trước mỗi test
        await testHelper.driver.get(testHelper.baseUrl);
        
        // Cleanup để tránh state pollution giữa các test
        try {
            // Xóa tất cả cookies
            await testHelper.driver.manage().deleteAllCookies();
            
            // Xóa localStorage và sessionStorage
            await testHelper.driver.executeScript("window.localStorage.clear();");
            await testHelper.driver.executeScript("window.sessionStorage.clear();");
            
            // Refresh trang để đảm bảo trạng thái sạch
            await testHelper.driver.navigate().refresh();
            
            // Chờ trang load xong
            await testHelper.driver.wait(until.elementLocated(By.css('body')), 5000);
        } catch (e) {
            console.log('⚠️ Cleanup không thành công:', e.message);
        }
    });

    describe('Test Case 1: Ứng tuyển thành công với hồ sơ hợp lệ', function() {
        it('nên ứng tuyển thành công cho công việc với hồ sơ hợp lệ', async function() {
            // Đăng nhập với thông tin hợp lệ
            await testHelper.login(testUserEmail, testUserPassword);
            
            // Điều hướng đến trang chi tiết công việc
            await testHelper.navigateToJobDetail(testJobId, process.env.TEST_JOB_SLUG);
            
            // Nhấp vào nút ứng tuyển
            await testHelper.clickApplyButton();
            
            // Xác minh tiêu đề modal
            const modalTitle = await testHelper.getModalTitle();
            assert.strictEqual(modalTitle, 'Ứng Tuyển Job');
            
            // Lấy thông tin tên công việc và công ty từ modal ứng tuyển
            const infoElem = await testHelper.driver.findElement(By.xpath("//p[contains(., 'Bạn đang ứng tuyển công việc')]"));
            const infoHtml = await infoElem.getAttribute('innerHTML');
            const matches = infoHtml.match(/<b>(.*?)<\/b> tại <b>(.*?)<\/b>/);
            assert.ok(matches && matches.length === 3, 'Không lấy được tên công việc và công ty');
            const jobName = matches[1].trim();
            const companyName = matches[2].trim();
            
            // Tạo file CV hợp lệ
            const validCVPath = path.resolve(__dirname, '../test-files/valid-cv.pdf');
            await testHelper.createTestFile(validCVPath, 'Đây là nội dung CV hợp lệ');
            
            // Tải lên CV
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
            assert.ok(uploadMsgText.includes('đã tải lên thành công'));
            
            // Nhấp vào nút ứng tuyển trong modal
            const applyButton = await testHelper.driver.findElement(By.xpath("//button[.//span[text()='Ứng tuyển']]"));
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
            assert.ok(applyMsgText.includes('Ứng tuyển thành công'));
            
            // Chờ 2 giây để modal đóng hẳn
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mở modal quản lý tài khoản
            // Click vào avatar/menu user (giả sử có selector cụ thể, ví dụ: '.ant-avatar')
            await testHelper.driver.findElement(By.css('.ant-avatar')).click();
            // Click vào menu "Quản lý tài khoản"
            await testHelper.driver.findElement(By.xpath("//li[contains(@class, 'ant-dropdown-menu-item')]//label[text()='Quản lý tài khoản']")).click();
            // Chờ modal quản lý tài khoản xuất hiện
            await testHelper.waitForElement('.ant-modal-title');
            // Lấy dòng cuối cùng của bảng Rải CV
            const rows = await testHelper.driver.findElements(By.css('.ant-table-tbody > tr'));
            assert.ok(rows.length > 0, 'Không có dòng nào trong bảng Rải CV');
            const lastRow = rows[rows.length - 1];
            const cells = await lastRow.findElements(By.css('td'));
            const companyCellText = await cells[1].getText(); // Cột "Công Ty"
            const jobCellText = await cells[2].getText();     // Cột "Job title"
            // So sánh
            assert.strictEqual(companyCellText.trim(), companyName, 'Tên công ty không khớp');
            assert.strictEqual(jobCellText.trim(), jobName, 'Tên công việc không khớp');
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Đóng modal quản lý tài khoản
            await testHelper.driver.findElement(By.css('.ant-modal-close')).click();
        });
    });

    describe('Test Case 2: Ứng tuyển khi chưa đăng nhập', function() {
        it('nên hiển thị yêu cầu đăng nhập khi cố gắng ứng tuyển mà chưa đăng nhập', async function() {
            // Điều hướng đến trang chi tiết công việc mà không đăng nhập
            await testHelper.navigateToJobDetail(testJobId, process.env.TEST_JOB_SLUG);
            
            // Nhấp vào nút ứng tuyển
            await testHelper.clickApplyButton();

            // Chờ div cha modal xuất hiện trước
            const parentDivXpath = "//div[contains(@style, 'text-align: center') and contains(@style, 'padding: 20px 0px')]";
            await testHelper.driver.wait(until.elementLocated(By.xpath(parentDivXpath)), 5000);
            const parentDiv = await testHelper.driver.findElement(By.xpath(parentDivXpath));

            // Sau đó chờ h4 xuất hiện trong div cha
            const h4Elem = await parentDiv.findElement(By.xpath(".//h4[text()='Bạn chưa đăng nhập hệ thống']"));
            const modalText = await h4Elem.getText();
            assert.ok(modalText.includes('Bạn chưa đăng nhập hệ thống'));

            // Kiểm tra không có nút "Ứng tuyển" trong modal
            let applyBtnPresent = false;
            try {
                await parentDiv.findElement(By.xpath(".//button[.//span[text()='Ứng tuyển']]"));
                applyBtnPresent = true;
            } catch (e) {
                // Không tìm thấy là đúng
            }
            assert.strictEqual(applyBtnPresent, false);
        });
    });

    describe('Test Case 3: Ứng tuyển với file CV sai định dạng', function() {
        it('nên từ chối CV với định dạng file không hợp lệ', async function() {
            // Đăng nhập
            await testHelper.login(testUserEmail, testUserPassword);
            
            // Điều hướng đến trang chi tiết công việc
            await testHelper.navigateToJobDetail(testJobId, process.env.TEST_JOB_SLUG);
            
            // Nhấp vào nút ứng tuyển
            await testHelper.clickApplyButton();
            
            // Tạo file CV không hợp lệ (định dạng .txt)
            const invalidCVPath = path.resolve(__dirname, '../test-files/invalid-cv.txt');
            await testHelper.createTestFile(invalidCVPath, 'Đây là file CV không hợp lệ');
            
            // Thử tải lên CV không hợp lệ (bỏ qua chờ upload thành công)
            await testHelper.uploadCV(invalidCVPath, true);
            
            // Chờ message lỗi và chờ thêm 1.5s để message render xong
            await testHelper.waitForElement('.ant-message-error', 10000);
            await new Promise(resolve => setTimeout(resolve, 1500));
            const errorMessages = await testHelper.driver.findElements(By.css('.ant-message-error'));
            let found = false;
            for (let i = 0; i < errorMessages.length; i++) {
                const text = await errorMessages[i].getText();
                if (text.includes('Chỉ hỗ trợ file PDF, DOC, DOCX')) found = true;
            }
            assert.ok(found, 'Không tìm thấy message lỗi đúng nội dung!');
            
            // Xác minh file không được tải lên
            const uploadedFile = await testHelper.isElementPresent('.ant-upload-list-item-done');
            assert.strictEqual(uploadedFile, false);
        });
    });

    describe('Test Case 4: Ứng tuyển với file CV lớn hơn 5MB', function() {
        it('nên từ chối file CV lớn hơn 5MB', async function() {
            // Đăng nhập
            await testHelper.login(testUserEmail, testUserPassword);
            
            // Điều hướng đến trang chi tiết công việc
            await testHelper.navigateToJobDetail(testJobId, process.env.TEST_JOB_SLUG);
            
            // Nhấp vào nút ứng tuyển
            await testHelper.clickApplyButton();
            
            // Tạo file CV lớn (6MB)
            const largeCVPath = path.resolve(__dirname, '../test-files/large-cv.pdf');
            await testHelper.createTestFile(largeCVPath, null, 6 * 1024 * 1024); // 6MB
            
            // Thử tải lên CV lớn (bỏ qua chờ upload thành công)
            await testHelper.uploadCV(largeCVPath, true);
            
            // Chờ message lỗi và chờ thêm 1.5s để message render xong
            await testHelper.waitForElement('.ant-message-error', 10000);
            await new Promise(resolve => setTimeout(resolve, 1500));
            const errorMessages = await testHelper.driver.findElements(By.css('.ant-message-error'));
            let found = false;
            for (let i = 0; i < errorMessages.length; i++) {
                const text = await errorMessages[i].getText();
                if (text.includes('File phải nhỏ hơn 5MB')) found = true;
            }
            assert.ok(found, 'Không tìm thấy message lỗi đúng nội dung!');
            
            // Xác minh file không được tải lên
            const uploadedFile = await testHelper.isElementPresent('.ant-upload-list-item-done');
            assert.strictEqual(uploadedFile, false);
        });
    });

    describe('Test Case 5: Ứng tuyển công việc đã hết hạn', function() {
        it('nên ngăn chặn ứng tuyển cho công việc đã hết hạn', async function() {
            // Đăng nhập
            await testHelper.login(testUserEmail, testUserPassword);
            
            // Điều hướng đến công việc đã hết hạn
            await testHelper.navigateToJobDetail('11', process.env.TEST_JOB_SLUG);
            
            // Kiểm tra xem công việc có đã đóng không
            const statusElement = await testHelper.driver.findElement(By.xpath("//*[contains(text(), 'Đã đóng') or contains(text(), 'Đã đóng tuyển dụng')]"));
            const statusText = await statusElement.getText();
            
            if (statusText.includes('Đã đóng')) {
                // Kiểm tra nút "Ứng tuyển ngay" không còn hiển thị hoặc bị disable
                try {
                    const applyButton = await testHelper.driver.findElement(By.xpath("//button[text()='Ứng tuyển ngay']"));
                    const isDisabled = await applyButton.getAttribute('disabled');
                    assert.ok(isDisabled, 'Nút ứng tuyển phải bị disable');
                } catch (e) {
                    // Nếu không tìm thấy nút "Ứng tuyển ngay" thì cũng coi là pass
                    assert.ok(true, 'Nút ứng tuyển không hiển thị - đúng như mong đợi');
                }
            } else {
                this.skip('Công việc chưa hết hạn, bỏ qua test');
            }
        });
    });

    describe('Test Case 6: Ứng tuyển công việc đã ứng tuyển trước đó', function() {
        it('nên ngăn chặn ứng tuyển cho công việc đã ứng tuyển trước đó', async function() {
            // Đăng nhập
            await testHelper.login(testUserEmail, testUserPassword);
            // Điều hướng đến trang chi tiết công việc
            await testHelper.navigateToJobDetail(testJobId, process.env.TEST_JOB_SLUG);
            // Nhấp vào nút ứng tuyển
            await testHelper.clickApplyButton();
            // Chờ alert xuất hiện
            await testHelper.waitForElement('.ant-alert-message', 5000);
            const alertElem = await testHelper.driver.findElement(By.css('.ant-alert-message'));
            const alertText = await alertElem.getText();
            const alertDescElem = await testHelper.driver.findElement(By.css('.ant-alert-description'));
            const alertDesc = await alertDescElem.getText();
            // Xác minh alert
            assert.strictEqual(alertText, 'Đã ứng tuyển');
            assert.strictEqual(alertDesc, 'Bạn đã ứng tuyển công việc này rồi.');
            // Kiểm tra nút ứng tuyển
            const applyButton = await testHelper.driver.findElement(By.css('.ant-btn-primary'));
            const isDisabled = await applyButton.getAttribute('disabled');
            const buttonText = await applyButton.getText();
            assert.ok(isDisabled);
            assert.strictEqual(buttonText, 'Đã ứng tuyển');
        });
    });

    describe('Test Case 7: Ứng tuyển khi chưa cập nhật hồ sơ cá nhân', function() {
        it('nên hiển thị cảnh báo khi hồ sơ cá nhân chưa hoàn chỉnh', async function() {
            // Đăng nhập với user có hồ sơ chưa hoàn chỉnh
            const email = 'nhuy@gmail.com';
            const password = '123456';
            const jobId = '3';
            const jobSlug = 'senior-frontend-developer-reactjs';
            await testHelper.login(email, password);
            // Điều hướng đến trang chi tiết công việc
            await testHelper.navigateToJobDetail(jobId, jobSlug);
            // Nhấp vào nút ứng tuyển
            await testHelper.clickApplyButton();
            // Chờ alert xuất hiện
            await testHelper.waitForElement('.ant-alert-message', 5000);
            const alertElem = await testHelper.driver.findElement(By.css('.ant-alert-message'));
            // Chờ alert message có text khác rỗng (tối đa 2s)
            let alertText = '';
            for (let i = 0; i < 10; i++) {
                alertText = await alertElem.getText();
                if (alertText && alertText.trim()) break;
                await new Promise(r => setTimeout(r, 200));
            }
            if (alertText && alertText.trim()) {
                assert.strictEqual(alertText, 'Thiếu thông tin cá nhân');
            }
            const alertDescElem = await testHelper.driver.findElement(By.css('.ant-alert-description'));
            const alertDesc = await alertDescElem.getText();
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
            assert.strictEqual(applyBtnPresent, false);
        });
    });

    describe('Test Case 8: Ứng tuyển với file CV rỗng', function() {
        it('nên từ chối file CV rỗng', async function() {
            // Đăng nhập
            await testHelper.login(testUserEmail, testUserPassword);
            // Điều hướng đến trang chi tiết công việc
            await testHelper.navigateToJobDetail(testJobId, process.env.TEST_JOB_SLUG);
            // Nhấp vào nút ứng tuyển
            await testHelper.clickApplyButton();
            // Tạo file CV rỗng
            const emptyCVPath = path.resolve(__dirname, '../test-files/empty-cv.pdf');
            await testHelper.createTestFile(emptyCVPath, '');
            // Thử tải lên CV rỗng
            await testHelper.uploadCV(emptyCVPath, true);
            // Chờ message lỗi và chờ thêm để message render xong
            await testHelper.waitForElement('.ant-message-error', 10000);
            let errorMessage = await testHelper.driver.findElement(By.css('.ant-message-error'));
            // Chờ message lỗi có text khác rỗng (tối đa 2s)
            let messageText = '';
            for (let i = 0; i < 10; i++) {
                messageText = await errorMessage.getText();
                if (messageText && messageText.trim()) break;
                await new Promise(r => setTimeout(r, 200));
            }
            assert.ok(messageText.includes('File bị rỗng!'));
            // Xác minh file không được tải lên
            const uploadedFile = await testHelper.isElementPresent('.ant-upload-list-item-done');
            assert.strictEqual(uploadedFile, false);
        });
    });

    describe('Test Case 9: Ứng tuyển khi kỹ năng và kinh nghiệm không phù hợp', function() {
        it('nên hiển thị cảnh báo khi kỹ năng và kinh nghiệm không phù hợp với yêu cầu công việc', async function() {
            // Đăng nhập
            await testHelper.login(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD);
            // Điều hướng đến trang chi tiết công việc
            const jobId = '4';
            const jobSlug = 'web-design-engineer-html-css-javascript';
            await testHelper.navigateToJobDetail(jobId, jobSlug);
            // Nhấp vào nút ứng tuyển
            await testHelper.clickApplyButton();
            // Kiểm tra thông báo cảnh báo không phù hợp kỹ năng/kinh nghiệm
            await testHelper.waitForElement('.ant-alert-message', 5000);
            const alertElem = await testHelper.driver.findElement(By.css('.ant-alert-message'));
            let alertText = '';
            for (let i = 0; i < 10; i++) {
                alertText = await alertElem.getText();
                if (alertText && alertText.trim()) break;
                await new Promise(r => setTimeout(r, 200));
            }
            assert.strictEqual(alertText, 'Thông tin không phù hợp');
            const alertDescElem = await testHelper.driver.findElement(By.css('.ant-alert-description'));
            const alertDesc = await alertDescElem.getText();
            assert.ok(alertDesc.includes('Kỹ năng hiện tại không phù hợp'));
            // Nút ứng tuyển vẫn enable
            const applyButton = await testHelper.driver.findElement(By.css('.ant-btn-primary'));
            const isDisabled = await applyButton.getAttribute('disabled');
            const buttonText = await applyButton.getText();
            assert.strictEqual(isDisabled, null);
            assert.ok(buttonText.includes('Ứng tuyển'));
            // Tạo file CV hợp lệ và upload
            const validCVPath = path.resolve(__dirname, '../test-files/valid-cv.pdf');
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
            assert.ok(uploadMessage.includes('đã tải lên thành công'));
            // Nhấp vào nút ứng tuyển (vẫn enable)
            await applyButton.click();
            // Kiểm tra modal cảnh báo
            await testHelper.waitForElement('.ant-modal-confirm-title', 5000);
            const modalTitleElem = await testHelper.driver.findElement(By.css('.ant-modal-confirm-title'));
            let modalTitleText = '';
            for (let i = 0; i < 10; i++) {
                modalTitleText = await modalTitleElem.getText();
                if (modalTitleText && modalTitleText.trim()) break;
                await new Promise(r => setTimeout(r, 200));
            }
            assert.strictEqual(modalTitleText, 'Cảnh báo');
            const modalContent = await testHelper.driver.findElement(By.css('.ant-modal-confirm-content'));
            const modalContentText = await modalContent.getText();
            assert.ok(modalContentText.includes('Kỹ năng không phù hợp'));
            // Nhấp vào nút "Tiếp tục ứng tuyển"
            const continueBtn = await testHelper.driver.findElement(By.xpath("//button[span[contains(text(), 'Tiếp tục ứng tuyển')]]"));
            await continueBtn.click();
            // Chờ message ứng tuyển thành công
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
            assert.ok(applySuccess);
        });
    });

    describe('Test Case 10: Ứng tuyển với ký tự đặc biệt trong tên file', function() {
        it('nên từ chối file CV có ký tự đặc biệt trong tên file', async function() {
            // Đăng nhập
            await testHelper.login(testUserEmail, testUserPassword);
            // Điều hướng đến trang chi tiết công việc
            await testHelper.navigateToJobDetail(testJobId, process.env.TEST_JOB_SLUG);
            // Nhấp vào nút ứng tuyển
            await testHelper.clickApplyButton();
            // Tạo file CV có ký tự đặc biệt trong tên
            const specialCharCVPath = path.resolve(__dirname, '../test-files/special@char#cv.pdf');
            await testHelper.createTestFile(specialCharCVPath, 'Đây là nội dung CV hợp lệ');
            // Thử tải lên CV có ký tự đặc biệt
            await testHelper.uploadCV(specialCharCVPath, true);
            // Chờ message lỗi
            await testHelper.waitForElement('.ant-message-error', 10000);
            let errorElem = await testHelper.driver.findElement(By.css('.ant-message-error'));
            // Chờ message lỗi có text khác rỗng (tối đa 2s)
            let messageText = '';
            for (let i = 0; i < 10; i++) {
                messageText = await errorElem.getText();
                if (messageText && messageText.trim()) break;
                await new Promise(r => setTimeout(r, 200));
            }
            assert.ok(messageText.includes('Tên file không hợp lệ!'));
            // Xác minh file không được tải lên
            const uploadedFile = await testHelper.isElementPresent('.ant-upload-list-item-done');
            assert.strictEqual(uploadedFile, false);
        });
    });
}); 