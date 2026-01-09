// Quick debug test
const DataManagementService = require('./src/services/dataManagementService').default;
const { DATA_TYPE } = require('./src/types/dataManagement');

// Test confirmation phrase generation
const dataTypes = [DATA_TYPE.LOANS];
const phrase = DataManagementService._generateConfirmationPhrase(dataTypes);
console.log('Generated phrase:', phrase);
console.log('Expected:', 'DELETE LOANS');
console.log('Match:', phrase === 'DELETE LOANS');
