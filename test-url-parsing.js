// 测试URL解析逻辑
const testUrl = 'lobehub://plugin/install?type=mcp&id=test';

console.log('测试URL:', testUrl);

const parsedUrl = new URL(testUrl);
console.log('原始解析结果:');
console.log('- protocol:', parsedUrl.protocol);
console.log('- hostname:', parsedUrl.hostname); 
console.log('- pathname:', parsedUrl.pathname);
console.log('- search:', parsedUrl.search);

// 修复后的解析逻辑
const urlType = parsedUrl.hostname; // "plugin"
const pathParts = parsedUrl.pathname.split('/').filter(Boolean); // ["install"]
const action = pathParts[0]; // "install"

console.log('\n修复后的解析结果:');
console.log('- urlType:', urlType);
console.log('- action:', action);
console.log('- pathParts:', pathParts);

// 验证预期结果
const expected = { urlType: 'plugin', action: 'install' };
const actual = { urlType, action };

console.log('\n验证结果:');
console.log('- 预期:', expected);
console.log('- 实际:', actual);
console.log('- 匹配:', JSON.stringify(expected) === JSON.stringify(actual) ? '✅' : '❌'); 