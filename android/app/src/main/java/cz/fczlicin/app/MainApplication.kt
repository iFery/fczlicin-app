package cz.fczlicin.app

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

import com.google.firebase.FirebaseApp

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
          override fun getPackages(): List<ReactPackage> {
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // packages.add(new MyReactNativePackage());
            return PackageList(this).packages
          }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
          override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    
    // CRITICAL: Initialize Firebase FIRST, before any other initialization
    // This ensures Firebase is ready before @react-native-firebase/crashlytics native module
    // tries to initialize. Without this, we get "Default FirebaseApp is not initialized" error.
    // React Native Firebase should auto-initialize from google-services.json, but in some
    // Expo + Dev Client configurations this doesn't happen early enough.
    try {
      if (FirebaseApp.getApps(this).isEmpty()) {
        android.util.Log.d("MainApplication", "Initializing Firebase explicitly...")
        FirebaseApp.initializeApp(this)
        android.util.Log.d("MainApplication", "Firebase initialized successfully")
      } else {
        android.util.Log.d("MainApplication", "Firebase already initialized")
      }
    } catch (e: Exception) {
      // Log but don't crash - React Native Firebase will handle initialization
      android.util.Log.w("MainApplication", "Firebase initialization attempt: ${e.message}", e)
    }
    
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
