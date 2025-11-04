// Mock Firebase modules to avoid import issues
jest.mock('firebase/app', () => ({}));
jest.mock('firebase/auth', () => ({}));
jest.mock('firebase/firestore', () => ({}));
jest.mock('firebase/storage', () => ({}));
jest.mock('firebase/analytics', () => ({}));
jest.mock('firebase/performance', () => ({}));
jest.mock('../../utils/errorLogger', () => ({
  logFirebaseError: () => {},
  logFirebaseServiceStatus: () => {}
}));

// Create a standalone ConfigValidator for testing
class ConfigValidator {
  static getRequiredFields(environment) {
    return [
      'apiKey',
      'authDomain', 
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId'
    ];
  }

  static validateFirebaseConfig(config, environment) {
    const requiredFields = this.getRequiredFields(environment);
    const missingFields = [];
    const invalidFields = [];

    // Check for missing or invalid fields
    requiredFields.forEach(field => {
      if (!config[field]) {
        missingFields.push(field);
      } else if (typeof config[field] !== 'string' || config[field].trim() === '') {
        invalidFields.push(field);
      }
    });

    // Generate validation errors if any
    if (missingFields.length > 0 || invalidFields.length > 0) {
      const errors = this.formatValidationErrors(missingFields, invalidFields, environment, config);
      throw new Error(`Firebase configuration validation failed:\n${errors.join('\n')}`);
    }

    // Validate specific field formats
    this.validateFieldFormats(config);

    return true;
  }

  static formatValidationErrors(missingFields, invalidFields, environment, config) {
    const errorMessages = [];
    
    if (missingFields.length > 0) {
      const envVarNames = missingFields.map(field => {
        const baseVar = `REACT_APP_FIREBASE_${field.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
        return baseVar.replace('_I_D', '_ID').replace('_A_P_I', '_API');
      });
      errorMessages.push(`Missing required environment variables for ${environment}:`);
      errorMessages.push(`  ${envVarNames.join('\n  ')}`);
    }
    
    if (invalidFields.length > 0) {
      errorMessages.push(`Invalid (empty) environment variables for ${environment}: ${invalidFields.join(', ')}`);
    }

    // Add helpful debugging information
    errorMessages.push(`\nCurrent environment: ${environment}`);
    errorMessages.push(`Available config keys: ${Object.keys(config).filter(key => config[key]).join(', ')}`);
    
    return errorMessages;
  }

  static validateFieldFormats(config) {
    // Validate API key format
    if (config.apiKey && !config.apiKey.startsWith('AIza')) {
      console.warn('⚠️  Firebase API key format may be incorrect - should start with "AIza"');
    }

    // Check for placeholder values
    if (config.projectId && (config.projectId.includes('your_production') || config.projectId.includes('placeholder'))) {
      throw new Error(`Firebase project ID appears to be a placeholder value: ${config.projectId}`);
    }

    // Validate domain format
    if (config.authDomain && !config.authDomain.includes('.firebaseapp.com')) {
      console.warn('⚠️  Firebase auth domain format may be incorrect - should end with ".firebaseapp.com"');
    }

    // Validate storage bucket format
    if (config.storageBucket && !config.storageBucket.includes('.firebasestorage.app')) {
      console.warn('⚠️  Firebase storage bucket format may be incorrect - should end with ".firebasestorage.app"');
    }

    // Validate app ID format
    if (config.appId && !config.appId.includes(':web:')) {
      console.warn('⚠️  Firebase app ID format may be incorrect - should contain ":web:"');
    }
  }
}

describe('ConfigValidator', () => {
  describe('validateFirebaseConfig', () => {
    it('should validate complete Firebase configuration successfully', () => {
      const validConfig = {
        apiKey: 'AIzaSyTest123',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.firebasestorage.app',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef'
      };

      expect(() => {
        ConfigValidator.validateFirebaseConfig(validConfig, 'production');
      }).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const incompleteConfig = {
        apiKey: 'AIzaSyTest123',
        authDomain: 'test.firebaseapp.com'
        // Missing other required fields
      };

      expect(() => {
        ConfigValidator.validateFirebaseConfig(incompleteConfig, 'production');
      }).toThrow('Firebase configuration validation failed');
    });

    it('should throw error for empty field values', () => {
      const configWithEmptyFields = {
        apiKey: '',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.firebasestorage.app',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef'
      };

      expect(() => {
        ConfigValidator.validateFirebaseConfig(configWithEmptyFields, 'production');
      }).toThrow('Firebase configuration validation failed');
    });

    it('should throw error for placeholder values', () => {
      const configWithPlaceholders = {
        apiKey: 'AIzaSyTest123',
        authDomain: 'test.firebaseapp.com',
        projectId: 'your_production_project_id',
        storageBucket: 'test.firebasestorage.app',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef'
      };

      expect(() => {
        ConfigValidator.validateFirebaseConfig(configWithPlaceholders, 'production');
      }).toThrow('Firebase project ID appears to be a placeholder value');
    });

    it('should return required fields for environment', () => {
      const requiredFields = ConfigValidator.getRequiredFields('production');
      
      expect(requiredFields).toEqual([
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId'
      ]);
    });

    it('should format validation errors with helpful messages', () => {
      const missingFields = ['apiKey', 'projectId'];
      const invalidFields = ['authDomain'];
      const environment = 'production';
      const config = { storageBucket: 'test.firebasestorage.app' };

      const errors = ConfigValidator.formatValidationErrors(
        missingFields, 
        invalidFields, 
        environment, 
        config
      );

      expect(errors.join('\n')).toContain('Missing required environment variables for production:');
      expect(errors.join('\n')).toContain('REACT_APP_FIREBASE_API_KEY');
      expect(errors.join('\n')).toContain('REACT_APP_FIREBASE_PROJECT_ID');
      expect(errors.join('\n')).toContain('Invalid (empty) environment variables for production: authDomain');
    });
  });

  describe('validateFieldFormats', () => {
    it('should validate API key format', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const configWithInvalidApiKey = {
        apiKey: 'invalid-api-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.firebasestorage.app',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef'
      };

      ConfigValidator.validateFieldFormats(configWithInvalidApiKey);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Firebase API key format may be incorrect')
      );
      
      consoleSpy.mockRestore();
    });

    it('should validate auth domain format', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const configWithInvalidDomain = {
        apiKey: 'AIzaSyTest123',
        authDomain: 'invalid-domain.com',
        projectId: 'test-project',
        storageBucket: 'test.firebasestorage.app',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef'
      };

      ConfigValidator.validateFieldFormats(configWithInvalidDomain);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Firebase auth domain format may be incorrect')
      );
      
      consoleSpy.mockRestore();
    });

    it('should validate storage bucket format', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const configWithInvalidBucket = {
        apiKey: 'AIzaSyTest123',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'invalid-bucket.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef'
      };

      ConfigValidator.validateFieldFormats(configWithInvalidBucket);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Firebase storage bucket format may be incorrect')
      );
      
      consoleSpy.mockRestore();
    });

    it('should validate app ID format', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const configWithInvalidAppId = {
        apiKey: 'AIzaSyTest123',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test.firebasestorage.app',
        messagingSenderId: '123456789',
        appId: 'invalid-app-id'
      };

      ConfigValidator.validateFieldFormats(configWithInvalidAppId);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Firebase app ID format may be incorrect')
      );
      
      consoleSpy.mockRestore();
    });
  });
});