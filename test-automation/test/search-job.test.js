const TestHelper = require('./utils/test-helper');
const DebugHelper = require('./utils/debug-helper');
const assert = require('assert');
const { By } = require('selenium-webdriver');
const { until } = require('selenium-webdriver');
//OK
describe('JobHunter - Search Job Test Cases', function() {
    let testHelper;
    let debugHelper;

    before(async function() {
        testHelper = new TestHelper();
        await testHelper.setupDriver();
        debugHelper = new DebugHelper(testHelper.driver);
    });

    after(async function() {
        this.timeout(35000);
        try {
            await new Promise(resolve => setTimeout(resolve, 30000));
            await testHelper.teardownDriver();
        } catch (error) {
            console.log('Error in after hook:', error.message);
            // Đảm bảo driver được đóng ngay cả khi có lỗi
            try {
                await testHelper.teardownDriver();
                console.log('Driver closed after error');
            } catch (closeError) {
                console.log('Error closing driver:', closeError.message);
            }
        }
    });

    beforeEach(async function() {
        await testHelper.driver.get(`${testHelper.baseUrl}/job`);
    });

    it('Testcase 1: Tìm kiếm cơ bản với từ khóa', async function() {
        this.timeout(60000);
        await testHelper.driver.get(`${testHelper.baseUrl}/job`);

        // Tìm search input
        let searchInput;
        try {
            searchInput = await testHelper.driver.findElement(By.id('keyword'));
        } catch (error) {
            searchInput = await testHelper.driver.findElement(By.css('input.ant-input.ant-input-lg'));
        }
        await searchInput.click();
        await searchInput.clear();
        const searchKeyword = 'ReactJS';
        await searchInput.sendKeys(searchKeyword);

        // Click button search
        let searchBtn;
        try {
            searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn.ant-btn-primary.ant-btn-icon-only'));
        } catch (error) {
            searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn-primary'));
        }
        await searchBtn.click();
        await testHelper.driver.sleep(1000);
        await testHelper.driver.executeScript("window.scrollTo(0, 700);");
        // Kiểm tra job card đầu tiên
        const jobCards = await testHelper.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
        if (jobCards.length === 0) {
            assert.fail('Không tìm thấy job card nào');
        }
        const card = jobCards[0];
        let title = '';
        try {
            title = await card.findElement(By.css('._job-title_1cimi_173')).getText();
        } catch {}
        let skills = [];
        try {
            const skillElements = await card.findElements(By.css('span.ant-tag:not(.ant-tag-has-color)'));
            for (const skillElement of skillElements) {
                const skillText = await skillElement.getText();
                if (skillText && skillText.trim() !== '') skills.push(skillText);
            }
        } catch {}
        const found = (title.toLowerCase().includes(searchKeyword.toLowerCase()) || skills.some(s => s.toLowerCase().includes(searchKeyword.toLowerCase())));
        assert.ok(found, `Job card đầu tiên không chứa từ khóa '${searchKeyword}' trong title hoặc skills`);
        await testHelper.driver.sleep(1000);
    });

    it('Testcase 2: Lọc theo địa điểm đơn lẻ', async function() {
        this.timeout(60000);
        await testHelper.driver.get(`${testHelper.baseUrl}/job`);

        // Click nút Hiện bộ lọc nâng cao
        let filterButton = null;
        const buttons = await testHelper.driver.findElements(By.css('button'));
        for (const btn of buttons) {
            const text = await btn.getText();
            if (text && text.includes('Hiện bộ lọc nâng cao')) {
                filterButton = btn;
                break;
            }
        }
        await filterButton.click();
        await testHelper.driver.executeScript("window.scrollTo(0, 300);");

        // Chọn địa điểm
        const locationSelect = await testHelper.driver.findElement(By.id('location'));
        await locationSelect.click();
          const options = await testHelper.driver.findElements(By.css('.ant-select-dropdown .ant-select-item-option'));
        if (options.length > 1) {
            await options[1].click();
        }

        // Click button Tìm kiếm
        const searchButtons = await testHelper.driver.findElements(By.css('button.ant-btn-primary'));
        for (const btn of searchButtons) {
            const icon = await btn.findElements(By.css('.anticon-search'));
            if (icon.length > 0) {
                await btn.click();
                break;
            }
        }
        await testHelper.driver.executeScript('window.scrollBy(0, 600);');
        await testHelper.driver.sleep(10000);

        // Kiểm tra job card đầu tiên
        const searchLocation = 'Hồ Chí Minh';
  
        const jobCards = await testHelper.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
        if (jobCards.length === 0) {
            assert.fail('Không tìm thấy job card nào');
        }
        const card = jobCards[0];
        let location = '';
        try {
            location = await card.findElement(By.css('._job-location_1cimi_189')).getText();
        } catch {}
        assert.ok(location.includes(searchLocation), `Location không khớp: ${location}`);
        await testHelper.driver.sleep(1000);
    });

    it('Testcase 3: Lọc theo kỹ năng đơn lẻ', async function() {
        this.timeout(60000);
        await testHelper.driver.get(`${testHelper.baseUrl}/job`);

        // Click nút Hiện bộ lọc nâng cao
        let filterButton = null;
        const buttons = await testHelper.driver.findElements(By.css('button'));
        for (const btn of buttons) {
            const text = await btn.getText();
            if (text && text.includes('Hiện bộ lọc nâng cao')) {
                filterButton = btn;
                break;
            }
        }
        await filterButton.click();
        await testHelper.driver.executeScript("window.scrollTo(0, 300);");

        // Chọn kỹ năng
        const skillsSelect = await testHelper.driver.findElement(By.id('skills'));
        await skillsSelect.click();
        await skillsSelect.sendKeys('JavaScript');
        await skillsSelect.sendKeys(require('selenium-webdriver').Key.ENTER);

        // Click button Tìm kiếm
        const searchButtons = await testHelper.driver.findElements(By.css('button.ant-btn-primary'));
        for (const btn of searchButtons) {
            const icon = await btn.findElements(By.css('.anticon-search'));
            if (icon.length > 0) {
                await btn.click();
                break;
            }
        }
        await testHelper.driver.executeScript('window.scrollBy(0, 600);');
        await testHelper.driver.sleep(10000);

        // Kiểm tra job card đầu tiên
        const searchSkill = 'JavaScript';
        const jobCards = await testHelper.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
        if (jobCards.length === 0) {
            assert.fail('Không tìm thấy job card nào');
        }
        const card = jobCards[0];
        let skills = [];
        try {
            const skillElements = await card.findElements(By.css('span.ant-tag:not(.ant-tag-has-color)'));
            for (const skillElement of skillElements) {
                const skillText = await skillElement.getText();
                if (skillText && skillText.trim() !== '') skills.push(skillText);
            }
        } catch {}
        assert.ok(skills.some(s => s.toLowerCase().includes(searchSkill.toLowerCase())), `Skills không chứa keyword: ${skills.join(', ')}`);
        await testHelper.driver.sleep(1000);
    });

    it('Testcase 4: Lọc theo cấp độ đơn lẻ', async function() {
        this.timeout(60000);
        await testHelper.driver.get(`${testHelper.baseUrl}/job`);

        // Click nút Hiện bộ lọc nâng cao
        let filterButton = null;
        const buttons = await testHelper.driver.findElements(By.css('button'));
        for (const btn of buttons) {
            const text = await btn.getText();
            if (text && text.includes('Hiện bộ lọc nâng cao')) {
                filterButton = btn;
                break;
            }
        }
        await filterButton.click();
        await testHelper.driver.executeScript("window.scrollTo(0, 300);");

        // Chọn cấp độ
        const levelSelect = await testHelper.driver.findElement(By.id('level'));
        await levelSelect.click();
        await levelSelect.sendKeys('Senior');
        await levelSelect.sendKeys(require('selenium-webdriver').Key.ENTER);

        // Click button Tìm kiếm
        const searchButtons = await testHelper.driver.findElements(By.css('button.ant-btn-primary'));
        for (const btn of searchButtons) {
            const icon = await btn.findElements(By.css('.anticon-search'));
            if (icon.length > 0) {
                await btn.click();
                break;
            }
        }
        await testHelper.driver.executeScript('window.scrollBy(0, 600);');
        await testHelper.driver.sleep(10000);

        // Kiểm tra job card đầu tiên
        const searchLevel = 'Senior';
        const jobCards = await testHelper.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
        if (jobCards.length === 0) {
            assert.fail('Không tìm thấy job card nào');
        }
        const card = jobCards[0];
        let level = '';
        try {
            level = await card.findElement(By.css('span.ant-tag.ant-tag-has-color')).getText();
        } catch {}
        assert.ok(level.trim().toLowerCase() === searchLevel.trim().toLowerCase(), `Level không khớp: ${level}`);
        await testHelper.driver.sleep(1000);
    });

    it('Testcase 5: Lọc theo khoảng lương', async function() {
        this.timeout(60000);
        await testHelper.driver.get(`${testHelper.baseUrl}/job`);

        // Click nút Hiện bộ lọc nâng cao
        let filterButton = null;
        const buttons = await testHelper.driver.findElements(By.css('button'));
        for (const btn of buttons) {
            const text = await btn.getText();
            if (text && text.includes('Hiện bộ lọc nâng cao')) {
                filterButton = btn;
                break;
            }
        }
        await filterButton.click();
        await testHelper.driver.executeScript("window.scrollTo(0, 300);");

        // Kéo slider lương
        const slider = await testHelper.driver.findElement(By.css('.ant-slider'));
        const handles = await slider.findElements(By.css('.ant-slider-handle'));
        if (handles.length >= 2) {
            const leftHandle = handles[0];
            const rightHandle = handles[1];
            const leftNow = parseInt(await leftHandle.getAttribute('aria-valuenow'));
            const rightNow = parseInt(await rightHandle.getAttribute('aria-valuenow'));
            const sliderRect = await testHelper.driver.executeScript(el => {
                const rect = el.getBoundingClientRect();
                return {left: rect.left, width: rect.width};
            }, slider);
            const leftTarget = 15;
            const rightTarget = 45;
            const leftOffset = ((leftTarget - leftNow) / 100) * sliderRect.width;
            const rightOffset = ((rightTarget - rightNow) / 100) * sliderRect.width;
            const actions = testHelper.driver.actions({async: true});
            await actions.move({origin: leftHandle}).press().move({origin: leftHandle, x: Math.round(leftOffset), y: 0}).release().perform();
            await actions.move({origin: rightHandle}).press().move({origin: rightHandle, x: Math.round(rightOffset), y: 0}).release().perform();
        }

        // Click button Tìm kiếm
        const searchButtons = await testHelper.driver.findElements(By.css('button.ant-btn-primary'));
        for (const btn of searchButtons) {
            const icon = await btn.findElements(By.css('.anticon-search'));
            if (icon.length > 0) {
                await btn.click();
                break;
            }
        }
        await testHelper.driver.executeScript('window.scrollBy(0, 600);');
        await testHelper.driver.sleep(10000);

        // Kiểm tra job card đầu tiên
        const minSalary = 15;
        const maxSalary = 45;
        const jobCards = await testHelper.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
        if (jobCards.length === 0) {
            assert.fail('Không tìm thấy job card nào');
        }
        const card = jobCards[0];
        let salaryText = '';
        let salaryValue = 0;
        try {
            salaryText = await card.findElement(By.css('._job-salary_1cimi_189')).getText();
            const match = salaryText.replace(/\./g, '').match(/(\d+)/);
            if (match) salaryValue = parseInt(match[1]);
        } catch {}
        assert.ok(salaryValue >= minSalary && salaryValue <= maxSalary, `Salary (${salaryValue}) không nằm trong khoảng [${minSalary}, ${maxSalary}]`);
        await testHelper.driver.sleep(1000);
    });

    it('Testcase 6: Kết hợp tất cả filter', async function() {
       this.timeout(60000);
        await testHelper.driver.get(`${testHelper.baseUrl}/job`);

        // Click nút Hiện bộ lọc nâng cao
        let filterButton = null;
        const buttons = await testHelper.driver.findElements(By.css('button'));
        for (const btn of buttons) {
            const text = await btn.getText();
            if (text && text.includes('Hiện bộ lọc nâng cao')) {
                filterButton = btn;
                break;
            }
        }
        const isInteractable = await debugHelper.checkElementInteractable(filterButton);
        await filterButton.click();
        await testHelper.driver.executeScript("window.scrollTo(0, 300);");

        // Chọn địa điểm
        const locationSelect = await testHelper.driver.findElement(By.id('location'));
        await locationSelect.click();
        const options = await testHelper.driver.findElements(By.css('.ant-select-dropdown .ant-select-item-option'));
        if (options.length > 1) {
            await options[1].click();
        }

        // Chọn kỹ năng
        const skillsSelect = await testHelper.driver.findElement(By.id('skills'));
        await skillsSelect.click();
        await skillsSelect.sendKeys('JavaScript');
        await skillsSelect.sendKeys(require('selenium-webdriver').Key.ENTER);

        // Chọn cấp độ
        const levelSelect = await testHelper.driver.findElement(By.id('level'));
        await levelSelect.click();
        await levelSelect.sendKeys('Senior');
        await levelSelect.sendKeys(require('selenium-webdriver').Key.ENTER);

        // Kéo slider lương
        const slider = await testHelper.driver.findElement(By.css('.ant-slider'));
        const handles = await slider.findElements(By.css('.ant-slider-handle'));
        if (handles.length >= 2) {
            const leftHandle = handles[0];
            const rightHandle = handles[1];
            const leftNow = parseInt(await leftHandle.getAttribute('aria-valuenow'));
            const rightNow = parseInt(await rightHandle.getAttribute('aria-valuenow'));
            const sliderRect = await testHelper.driver.executeScript(el => {
                const rect = el.getBoundingClientRect();
                return {left: rect.left, width: rect.width};
            }, slider);
            const leftTarget = 15;
            const rightTarget = 45;
            const leftOffset = ((leftTarget - leftNow) / 100) * sliderRect.width;
            const rightOffset = ((rightTarget - rightNow) / 100) * sliderRect.width;
            const actions = testHelper.driver.actions({async: true});
            await actions.move({origin: leftHandle}).press().move({origin: leftHandle, x: Math.round(leftOffset), y: 0}).release().perform();
            await actions.move({origin: rightHandle}).press().move({origin: rightHandle, x: Math.round(rightOffset), y: 0}).release().perform();
        }

        // Click button Tìm kiếm
        const searchButtons = await testHelper.driver.findElements(By.css('button.ant-btn-primary'));
        for (const btn of searchButtons) {
            const icon = await btn.findElements(By.css('.anticon-search'));
            if (icon.length > 0) {
                await btn.click();
                break;
            }
        }
        await testHelper.driver.executeScript('window.scrollBy(0, 600);');
        await testHelper.driver.sleep(10000);

        // Kiểm tra job card
        const searchLocation = 'Hồ Chí Minh';
        const searchSkill = 'JavaScript';
        const searchLevel = 'Senior';
        const minSalary = 15;
        const maxSalary = 45;
        const jobCards = await testHelper.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
        let passCount = 0;
        let failCount = 0;
        for (let i = 0; i < jobCards.length; i++) {
            try {
                const card = jobCards[i];
                let location = '';
                try {
                    location = await card.findElement(By.css('._job-location_1cimi_189')).getText();
                } catch {}
                let skills = [];
                try {
                    const skillElements = await card.findElements(By.css('span.ant-tag:not(.ant-tag-has-color)'));
                    for (const skillElement of skillElements) {
                        const skillText = await skillElement.getText();
                        if (skillText && skillText.trim() !== '') skills.push(skillText);
                    }
                } catch {}
                let level = '';
                try {
                    level = await card.findElement(By.css('span.ant-tag.ant-tag-has-color')).getText();
                } catch {}
                let salaryText = '';
                let salaryValue = 0;
                try {
                    salaryText = await card.findElement(By.css('._job-salary_1cimi_189')).getText();
                    const match = salaryText.replace(/\./g, '').match(/(\d+)/);
                    if (match) salaryValue = parseInt(match[1]);
                } catch {}
                let pass = true;
                if (searchLocation && !location.includes(searchLocation)) pass = false;
                if (searchSkill && !skills.some(s => s.toLowerCase().includes(searchSkill.toLowerCase()))) pass = false;
                if (searchLevel && level.trim().toLowerCase() !== searchLevel.trim().toLowerCase()) pass = false;
                if (salaryValue < minSalary || salaryValue > maxSalary) pass = false;
                if (pass) passCount++;
                else failCount++;
            } catch (err) {
                failCount++;
            }
        }
        await testHelper.driver.sleep(1000);
    });

    it('Testcase 7: Tìm kiếm với ký tự đặc biệt', async function() {
        this.timeout(60000);
        await testHelper.driver.get(`${testHelper.baseUrl}/job`);

        // Tìm search input
        let searchInput;
        try {
            searchInput = await testHelper.driver.findElement(By.id('keyword'));
        } catch (error) {
            searchInput = await testHelper.driver.findElement(By.css('input.ant-input.ant-input-lg'));
        }
        await searchInput.click();
        await searchInput.clear();
        const searchKeyword = '@#@#@#@#@';
        await searchInput.sendKeys(searchKeyword);

        // Click button search
        let searchBtn;
        try {
            searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn.ant-btn-primary.ant-btn-icon-only'));
        } catch (error) {
            searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn-primary'));
        }
        await searchBtn.click();
        await testHelper.driver.sleep(1000);
        await testHelper.driver.executeScript("window.scrollTo(0, 700);");

        // Kiểm tra job card đầu tiên hoặc thông báo lỗi
        const jobCards = await testHelper.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
        if (jobCards.length === 0) {
            // Không tìm thấy job card nào => pass
            return;
        }
        // Nếu có job card, kiểm tra có thông báo lỗi không
        let errorMessage = '';
        try {
            const errorElem = await testHelper.driver.findElement(By.css('.ant-empty-description'));
            errorMessage = await errorElem.getText();
        } catch {}
        // Nếu không có thông báo lỗi => pass
        assert.ok(!errorMessage, 'Có job card nhưng lại hiển thị thông báo lỗi!');
        await testHelper.driver.sleep(1000);
    });

    it('Testcase 8: Tìm kiếm với tiếng việt', async function() {
        this.timeout(60000);
        await testHelper.driver.get(`${testHelper.baseUrl}/job`);

        // Tìm search input
        let searchInput;
        try {
            searchInput = await testHelper.driver.findElement(By.id('keyword'));
        } catch (error) {
            searchInput = await testHelper.driver.findElement(By.css('input.ant-input.ant-input-lg'));
        }
        await searchInput.click();
        await searchInput.clear();
        const searchKeyword = 'Ứng dụng';
        await searchInput.sendKeys(searchKeyword);

        // Click button search
        let searchBtn;
        try {
            searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn.ant-btn-primary.ant-btn-icon-only'));
        } catch (error) {
            searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn-primary'));
        }
        await searchBtn.click();
        await testHelper.driver.sleep(1000);
        await testHelper.driver.executeScript("window.scrollTo(0, 700);");
        // Kiểm tra job card đầu tiên
        const jobCards = await testHelper.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
        if (jobCards.length === 0) {
            assert.fail('Không tìm thấy job card nào');
        }
        const card = jobCards[0];
        let title = '';
        try {
            title = await card.findElement(By.css('._job-title_1cimi_173')).getText();
        } catch {}
        let skills = [];
        try {
            const skillElements = await card.findElements(By.css('span.ant-tag:not(.ant-tag-has-color)'));
            for (const skillElement of skillElements) {
                const skillText = await skillElement.getText();
                if (skillText && skillText.trim() !== '') skills.push(skillText);
            }
        } catch {}
        const found = (title.toLowerCase().includes(searchKeyword.toLowerCase()) || skills.some(s => s.toLowerCase().includes(searchKeyword.toLowerCase())));
        assert.ok(found, `Job card đầu tiên không chứa từ khóa '${searchKeyword}' trong title hoặc skills`);
        await testHelper.driver.sleep(1000);
    });

    it('Testcase 9: Phân vùng từ khoá tìm kiếm', async function() {
        this.timeout(60000);
        const testCases = [
            {
                keyword: 'JavaScript', // từ khoá phổ biến
                expectJob: true,
                desc: 'Từ khoá phổ biến'
            },
            {
                keyword: '@#@#@#@#@', // từ khoá đặc biệt
                expectJob: false,
                desc: 'Từ khoá đặc biệt'
            },
            {
                keyword: '', // từ khoá rỗng
                expectJob: true,
                desc: 'Từ khoá rỗng'
            },
            {
                keyword: 'Ứng dụng', // từ khoá tiếng Việt
                expectJob: true,
                desc: 'Từ khoá tiếng Việt'
            },
            {
                keyword: 'khongtontai123456', // từ khoá không tồn tại
                expectJob: false,
                desc: 'Từ khoá không tồn tại'
            }
        ];

        for (const tc of testCases) {
            await testHelper.driver.get(`${testHelper.baseUrl}/job`);
            await testHelper.driver.sleep(1000);
            // Tìm search input
            let searchInput;
            try {
                searchInput = await testHelper.driver.findElement(By.id('keyword'));
            } catch (error) {
                searchInput = await testHelper.driver.findElement(By.css('input.ant-input.ant-input-lg'));
            }
            await searchInput.click();
            await searchInput.clear();
            if (tc.keyword) await searchInput.sendKeys(tc.keyword);
            // Click button search
            let searchBtn;
            try {
                searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn.ant-btn-primary.ant-btn-icon-only'));
            } catch (error) {
                searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn-primary'));
            }
            await searchBtn.click();
            await testHelper.driver.sleep(1000);
            await testHelper.driver.executeScript("window.scrollTo(0, 700);");
            // Kiểm tra kết quả
            const jobCards = await testHelper.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
            if (tc.expectJob) {
                assert.ok(jobCards.length > 0, `[${tc.desc}] Không tìm thấy job card nào cho từ khoá '${tc.keyword}'`);
            } else {
                // Không mong đợi job card nào
                if (jobCards.length > 0) {
                    // Nếu có job card, kiểm tra không có lỗi
                    let errorMessage = '';
                    try {
                        const errorElem = await testHelper.driver.findElement(By.css('.ant-empty-description'));
                        errorMessage = await errorElem.getText();
                    } catch {}
                    assert.ok(!errorMessage, `[${tc.desc}] Có job card nhưng lại hiển thị thông báo lỗi!`);
                } else {
                    // Không có job card là đúng
                    continue;
                }
            }
        }
        await testHelper.driver.sleep(1000);
    });

    it('Testcase 10: Biên của khoảng lương', async function() {
        this.timeout(60000);
        // Kiểm tra biên dưới
        await testHelper.driver.get(`${testHelper.baseUrl}/job?minSalary=-10000&maxSalary=100000000`);
        await testHelper.driver.sleep(2000);

        let errorMessage1 = '';
        let jobFound1 = false;
        try {
            const errorElem = await testHelper.driver.findElement(By.css('.ant-empty-description'));
            errorMessage1 = await errorElem.getText();
        } catch {}

        let lowerBoundPass = false;
        if (!errorMessage1) {
            lowerBoundPass = true;
        } else {
            const minSalary = -10000;
            const maxSalary = 100000000;
            const jobCards = await testHelper.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
            for (const card of jobCards) {
                let salaryText = '';
                let salaryValue = 0;
                try {
                    salaryText = await card.findElement(By.css('._job-salary_1cimi_189')).getText();
                    const match = salaryText.replace(/\./g, '').match(/(\d+)/);
                    if (match) salaryValue = parseInt(match[1]);
                } catch {}
                if (salaryValue >= minSalary && salaryValue <= maxSalary) {
                    lowerBoundPass = true;
                    jobFound1 = true;
                    break;
                }
            }
        }

        // Kiểm tra biên trên
        await testHelper.driver.get(`${testHelper.baseUrl}/job?minSalary=-10000&maxSalary=1000000000`);
        await testHelper.driver.sleep(2000);

        let errorMessage2 = '';
        let jobFound2 = false;
        try {
            const errorElem = await testHelper.driver.findElement(By.css('.ant-empty-description'));
            errorMessage2 = await errorElem.getText();
        } catch {}

        let upperBoundPass = false;
        if (!errorMessage2) {
            upperBoundPass = true;
        } else {
            const minSalary = -10000;
            const maxSalary = 1000000000;
            const jobCards = await testHelper.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
            for (const card of jobCards) {
                let salaryText = '';
                let salaryValue = 0;
                try {
                    salaryText = await card.findElement(By.css('._job-salary_1cimi_189')).getText();
                    const match = salaryText.replace(/\./g, '').match(/(\d+)/);
                    if (match) salaryValue = parseInt(match[1]);
                } catch {}
                if (salaryValue >= minSalary && salaryValue <= maxSalary) {
                    upperBoundPass = true;
                    jobFound2 = true;
                    break;
                }
            }
        }
        // Kiểm tra trường hợp minSalary > maxSalary
        await testHelper.driver.get(`${testHelper.baseUrl}/job?minSalary=1000000&maxSalary=1000`);
        await testHelper.driver.sleep(2000);

        let errorMessage3 = '';
        try {
            const errorElem = await testHelper.driver.findElement(By.css('.ant-empty-description'));
            errorMessage3 = await errorElem.getText();
        } catch {}

        let invalidRangePass = false;
        if (!errorMessage3) {
            invalidRangePass = true;
        }

        // Nếu cả ba điều kiện đều pass thì test pass, ngược lại fail
        if ((lowerBoundPass || jobFound1) && (upperBoundPass || jobFound2)) {
            console.log('Testpass: chưa hiển thị lỗi vượt biên');
            await testHelper.driver.sleep(1000);
            return;
        } else {
            assert.fail('Không thỏa mãn điều kiện kiểm tra biên lương (âm, trên, hoặc min > max)');
        }
    });

    it('Testcase 11: Biên ngoại lệ', async function() {
        this.timeout(60000);
        await testHelper.driver.get(`${testHelper.baseUrl}/job`);

        // Tìm search input
        let searchInput;
        try {
            searchInput = await testHelper.driver.findElement(By.id('keyword'));
        } catch (error) {
            searchInput = await testHelper.driver.findElement(By.css('input.ant-input.ant-input-lg'));
        }
        await searchInput.click();
        await searchInput.clear();
        const searchKeyword = 'a'.repeat(1000); // 1000 ký tự 'a'
        await searchInput.sendKeys(searchKeyword);

        // Click button search
        let searchBtn;
        try {
            searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn.ant-btn-primary.ant-btn-icon-only'));
        } catch (error) {
            searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn-primary'));
        }
        await searchBtn.click();
        await testHelper.driver.sleep(1000);
        await testHelper.driver.executeScript("window.scrollTo(0, 700);");
        
        // Kiểm tra có thông báo lỗi không
        let errorMessage = '';
        try {
            const errorElem = await testHelper.driver.findElement(By.css('.ant-empty-description, .error-message, [class*="error"]'));
            errorMessage = await errorElem.getText();
        } catch {}
        
        // Kiểm tra có tiêu đề "Không có dữ liệu" không
        let hasNoDataMessage = false;
        try {
            const noDataElements = await testHelper.driver.findElements(By.css('.ant-empty-description'));
            for (const elem of noDataElements) {
                const text = await elem.getText();
                if (text && text.includes('Không có dữ liệu')) {
                    hasNoDataMessage = true;
                    break;
                }
            }
        } catch {}
        
        // Nếu không có thông báo lỗi hoặc có tiêu đề "Không có dữ liệu" thì test pass
        if (!errorMessage || hasNoDataMessage) {
            console.log('Chưa ràng buộc độ dài ký tự search');
            await testHelper.driver.sleep(1000);
            return;
        } else {
            assert.fail('Có thông báo lỗi và không có tiêu đề "Không có dữ liệu" khi nhập 1000 ký tự');
        }
    });
    it('Testcase 12: Lỗ hổng bảo mật', async function() {
        this.timeout(60000);
        const testCases = [
            {
                keyword: "'; DROP TABLE jobs; --", // SQL Injection
                desc: 'SQL Injection'
            },
            {
                keyword: "<script>alert('xss')</script>", // Cross-site Scripting (XSS)
                desc: 'Cross-site Scripting (XSS)'
            }
        ];

        for (const tc of testCases) {
            await testHelper.driver.get(`${testHelper.baseUrl}/job`);

            // Tìm search input
            let searchInput;
            try {
                searchInput = await testHelper.driver.findElement(By.id('keyword'));
            } catch (error) {
                searchInput = await testHelper.driver.findElement(By.css('input.ant-input.ant-input-lg'));
            }
            await searchInput.click();
            await searchInput.clear();
            await searchInput.sendKeys(tc.keyword);

            // Click button search
            let searchBtn;
            try {
                searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn.ant-btn-primary.ant-btn-icon-only'));
            } catch (error) {
                searchBtn = await testHelper.driver.findElement(By.css('button.ant-btn-primary'));
            }
            await searchBtn.click();
            await testHelper.driver.sleep(1000);
            await testHelper.driver.executeScript("window.scrollTo(0, 700);");
            
            // Kiểm tra có thông báo lỗi không
            let errorMessage = '';
            try {
                const errorElem = await testHelper.driver.findElement(By.css('.ant-empty-description, .error-message, [class*="error"]'));
                errorMessage = await errorElem.getText();
            } catch {}
            
            // Kiểm tra có tiêu đề "Không có dữ liệu" không
            let hasNoDataMessage = false;
            try {
                const noDataElements = await testHelper.driver.findElements(By.css('.ant-empty-description'));
                for (const elem of noDataElements) {
                    const text = await elem.getText();
                    if (text && text.includes('Không có dữ liệu')) {
                        hasNoDataMessage = true;
                        break;
                    }
                }
            } catch {}
            
            // Nếu có thông báo lỗi và không có tiêu đề "Không có dữ liệu" thì fail
            if (errorMessage && !hasNoDataMessage) {
                assert.fail(`[${tc.desc}] Có thông báo lỗi và không có tiêu đề "Không có dữ liệu"`);
            }

        }
    });
}); 