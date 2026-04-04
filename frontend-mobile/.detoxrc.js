/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.sim.release': {
      type: 'ios.simulator',
      build: 'pnpm build:ios:simulator',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/OmniPizza.app'
    },
    'android.emu.release': {
      type: 'android.emulator',
      build: 'pnpm build:android:test',
      binaryPath: 'android/app/build/outputs/apk/release/omnipizza-release.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/omnipizza-debug-androidTest.apk'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_31'
      }
    }
  },
  configurations: {
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.sim.release'
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.emu.release'
    }
  }
};
