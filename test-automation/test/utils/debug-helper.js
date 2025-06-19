const { By } = require('selenium-webdriver');

class DebugHelper {
    constructor(driver) {
        this.driver = driver;
    }
    //OK
    // Tìm tất cả input elements trên trang
    async findAllInputs() {
        const inputs = await this.driver.findElements(By.css('input'));
        console.log(`Found ${inputs.length} input elements:`);
        
        for (let i = 0; i < inputs.length; i++) {
            try {
                const input = inputs[i];
                const tagName = await input.getTagName();
                const type = await input.getAttribute('type');
                const id = await input.getAttribute('id');
                const className = await input.getAttribute('class');
                const placeholder = await input.getAttribute('placeholder');
                const value = await input.getAttribute('value');
                
                console.log(`Input ${i + 1}:`);
                console.log(`  Tag: ${tagName}`);
                console.log(`  Type: ${type}`);
                console.log(`  ID: ${id}`);
                console.log(`  Class: ${className}`);
                console.log(`  Placeholder: ${placeholder}`);
                console.log(`  Value: ${value}`);
                console.log('  ---');
            } catch (error) {
                console.log(`Error getting input ${i + 1} details:`, error.message);
            }
        }
    }

    // Tìm tất cả button elements trên trang
    async findAllButtons() {
        const buttons = await this.driver.findElements(By.css('button'));
        console.log(`Found ${buttons.length} button elements:`);
        
        for (let i = 0; i < buttons.length; i++) {
            try {
                const button = buttons[i];
                const tagName = await button.getTagName();
                const type = await button.getAttribute('type');
                const className = await button.getAttribute('class');
                const text = await button.getText();
                const innerHTML = await button.getAttribute('innerHTML');
                
                console.log(`Button ${i + 1}:`);
                console.log(`  Tag: ${tagName}`);
                console.log(`  Type: ${type}`);
                console.log(`  Class: ${className}`);
                console.log(`  Text: ${text}`);
                console.log(`  InnerHTML: ${innerHTML.substring(0, 100)}...`);
                console.log('  ---');
            } catch (error) {
                console.log(`Error getting button ${i + 1} details:`, error.message);
            }
        }
    }

    // Tìm element theo nhiều cách khác nhau
    async findElementWithMultipleSelectors(selectors) {
        for (const selector of selectors) {
            try {
                const element = await this.driver.findElement(selector);
                console.log(`Found element with selector: ${selector}`);
                return element;
            } catch (error) {
                console.log(`Not found with selector: ${selector}`);
            }
        }
        throw new Error('Element not found with any selector');
    }

    // Kiểm tra element có hiển thị và có thể tương tác không
    async checkElementInteractable(element) {
        try {
            const isDisplayed = await element.isDisplayed();
            const isEnabled = await element.isEnabled();
            const tagName = await element.getTagName();
            const className = await element.getAttribute('class');
            
            // console.log(`Element check:`);
            // console.log(`  Tag: ${tagName}`);
            // console.log(`  Class: ${className}`);
            // console.log(`  Is Displayed: ${isDisplayed}`);
            // console.log(`  Is Enabled: ${isEnabled}`);
            
            return isDisplayed && isEnabled;
        } catch (error) {
            console.log(`Error checking element:`, error.message);
            return false;
        }
    }

    // Chụp screenshot để debug
    async takeScreenshot(filename) {
        try {
            await this.driver.saveScreenshot(`./test-files/${filename}.png`);
            console.log(`Screenshot saved as ${filename}.png`);
        } catch (error) {
            console.log(`Error taking screenshot:`, error.message);
        }
    }

    // In ra page source để debug
    async printPageSource() {
        try {
            const pageSource = await this.driver.getPageSource();
            console.log('Page Source (first 1000 chars):');
            console.log(pageSource.substring(0, 1000));
        } catch (error) {
            console.log(`Error getting page source:`, error.message);
        }
    }

    // Tìm search input với nhiều selector
    async findSearchInput() {
        const selectors = [
            By.id('keyword'),
            By.css('input[placeholder="Tìm kiếm theo tên công việc, mô tả..."]'),
            By.css('input[placeholder*="Tìm kiếm"]'),
            By.css('input.ant-input.ant-input-lg'),
            By.css('input.ant-input'),
            By.css('input[type="text"]')
        ];
        
        return await this.findElementWithMultipleSelectors(selectors);
    }

    // Tìm search button với nhiều selector
    async findSearchButton() {
        const selectors = [
            By.css('.ant-input-suffix button.ant-btn-primary'),
            By.css('button .anticon-search'),
            By.css('.ant-input-suffix button'),
            By.css('button.ant-btn-primary'),
            By.css('button[type="button"]')
        ];
        
        return await this.findElementWithMultipleSelectors(selectors);
    }

    // Tìm tất cả job card items
    async findAllJobCards() {
        try {
            // Tìm tất cả các job card items trong ant-row
            const jobCards = await this.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
            console.log(`Found ${jobCards.length} job card items:`);
            
            for (let i = 0; i < jobCards.length; i++) {
                try {
                    const card = jobCards[i];
                    console.log(`\n=== Job Card ${i + 1} ===`);
                    
                    // Kiểm tra xem card có chứa job content không
                    const hasJobContent = await card.findElements(By.css('._card-job-content_1cimi_120')).then(elements => elements.length > 0);
                    
                    if (hasJobContent) {
                        // Lấy thông tin job title
                        const jobTitleElement = await card.findElement(By.css('._job-title_1cimi_173'));
                        const jobTitle = await jobTitleElement.getText();
                        console.log(`  Job Title: ${jobTitle}`);
                        
                        // Lấy thông tin company
                        const companyElement = await card.findElement(By.css('div[style*="font-size: 14px; color: rgb(102, 102, 102)"]'));
                        const company = await companyElement.getText();
                        console.log(`  Company: ${company}`);
                        
                        // Lấy thông tin location
                        const locationElement = await card.findElement(By.css('._job-location_1cimi_189'));
                        const location = await locationElement.getText();
                        console.log(`  Location: ${location}`);
                        
                        // Lấy thông tin salary
                        const salaryElement = await card.findElement(By.css('._job-salary_1cimi_189'));
                        const salary = await salaryElement.getText();
                        console.log(`  Salary: ${salary}`);
                        
                        // Lấy thông tin level
                        const levelElement = await card.findElement(By.css('span.ant-tag-has-color span'));
                        const level = await levelElement.getText();
                        console.log(`  Level: ${level}`);
                        
                        // Lấy thông tin skills
                        const skillElements = await card.findElements(By.css('span.ant-tag:not(.ant-tag-has-color)'));
                        const skills = [];
                        for (const skillElement of skillElements) {
                            const skillText = await skillElement.getText();
                            if (skillText && skillText.trim() !== '') {
                                skills.push(skillText);
                            }
                        }
                        console.log(`  Skills: ${skills.join(', ')}`);
                        
                        // Lấy thông tin updated time
                        const updatedElement = await card.findElement(By.css('._job-updatedAt_1cimi_208'));
                        const updatedTime = await updatedElement.getText();
                        console.log(`  Updated: ${updatedTime}`);
                        
                        // Lấy logo URL
                        const logoElement = await card.findElement(By.css('._job-logo_1cimi_155'));
                        const logoUrl = await logoElement.getAttribute('src');
                        console.log(`  Logo URL: ${logoUrl}`);
                        
                    } else {
                        console.log(`  This card doesn't contain job content (might be header or other content)`);
                    }
                    
                } catch (error) {
                    console.log(`Error processing job card ${i + 1}:`, error.message);
                }
            }
            
            return jobCards;
        } catch (error) {
            console.log(`Error finding job cards:`, error.message);
            return [];
        }
    }

    // Tìm job cards chứa từ khóa cụ thể
    async findJobCardsByKeyword(keyword) {
        try {
            const jobCards = await this.findAllJobCards();
            const matchingCards = [];
            
            for (let i = 0; i < jobCards.length; i++) {
                try {
                    const card = jobCards[i];
                    
                    // Kiểm tra job title
                    const jobTitleElement = await card.findElement(By.css('._job-title_1cimi_173'));
                    const jobTitle = await jobTitleElement.getText();
                    
                    // Kiểm tra skills
                    const skillElements = await card.findElements(By.css('span.ant-tag:not(.ant-tag-has-color)'));
                    const skills = [];
                    for (const skillElement of skillElements) {
                        const skillText = await skillElement.getText();
                        if (skillText && skillText.trim() !== '') {
                            skills.push(skillText);
                        }
                    }
                    
                    // Kiểm tra xem có chứa keyword không
                    const titleMatch = jobTitle.toLowerCase().includes(keyword.toLowerCase());
                    const skillMatch = skills.some(skill => skill.toLowerCase().includes(keyword.toLowerCase()));
                    
                    if (titleMatch || skillMatch) {
                        console.log(`✅ Found matching job card ${i + 1}:`);
                        console.log(`  Title: ${jobTitle}`);
                        console.log(`  Skills: ${skills.join(', ')}`);
                        matchingCards.push({
                            index: i + 1,
                            title: jobTitle,
                            skills: skills,
                            element: card
                        });
                    }
                    
                } catch (error) {
                    console.log(`Error checking job card ${i + 1} for keyword:`, error.message);
                }
            }
            
            console.log(`Found ${matchingCards.length} job cards containing keyword "${keyword}"`);
            return matchingCards;
            
        } catch (error) {
            console.log(`Error finding job cards by keyword:`, error.message);
            return [];
        }
    }

    // Đếm tổng số job cards
    async countJobCards() {
        try {
            const jobCards = await this.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
            let jobCount = 0;
            
            for (const card of jobCards) {
                const hasJobContent = await card.findElements(By.css('._card-job-content_1cimi_120')).then(elements => elements.length > 0);
                if (hasJobContent) {
                    jobCount++;
                }
            }
            
            console.log(`Total job cards found: ${jobCount}`);
            return jobCount;
            
        } catch (error) {
            console.log(`Error counting job cards:`, error.message);
            return 0;
        }
    }

    // Lấy thông tin chi tiết của một job card cụ thể
    async getJobCardDetails(cardIndex) {
        try {
            const jobCards = await this.driver.findElements(By.css('.ant-row .ant-col.ant-col-24.ant-col-md-12'));
            
            if (cardIndex < 0 || cardIndex >= jobCards.length) {
                console.log(`Invalid card index: ${cardIndex}. Available range: 0-${jobCards.length - 1}`);
                return null;
            }
            
            const card = jobCards[cardIndex];
            const hasJobContent = await card.findElements(By.css('._card-job-content_1cimi_120')).then(elements => elements.length > 0);
            
            if (!hasJobContent) {
                console.log(`Card ${cardIndex} doesn't contain job content`);
                return null;
            }
            
            const details = {};
            
            // Lấy tất cả thông tin
            details.title = await card.findElement(By.css('._job-title_1cimi_173')).getText();
            details.company = await card.findElement(By.css('div[style*="font-size: 14px; color: rgb(102, 102, 102)"]')).getText();
            details.location = await card.findElement(By.css('._job-location_1cimi_189')).getText();
            details.salary = await card.findElement(By.css('._job-salary_1cimi_189')).getText();
            details.level = await card.findElement(By.css('span.ant-tag-has-color span')).getText();
            details.updatedTime = await card.findElement(By.css('._job-updatedAt_1cimi_208')).getText();
            details.logoUrl = await card.findElement(By.css('._job-logo_1cimi_155')).getAttribute('src');
            
            // Lấy skills
            const skillElements = await card.findElements(By.css('span.ant-tag:not(.ant-tag-has-color)'));
            details.skills = [];
            for (const skillElement of skillElements) {
                const skillText = await skillElement.getText();
                if (skillText && skillText.trim() !== '') {
                    details.skills.push(skillText);
                }
            }
            
            console.log(`Job Card ${cardIndex} Details:`, details);
            return details;
            
        } catch (error) {
            console.log(`Error getting job card details:`, error.message);
            return null;
        }
    }
}

module.exports = DebugHelper; 