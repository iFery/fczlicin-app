import Expo
import FirebaseCore
import React
import UIKit

@objc(AppDelegate)
class AppDelegate: ExpoAppDelegate {
  @objc var window: UIWindow?
  private let moduleName = "main"
  private let initialProps: [AnyHashable: Any] = [:]
  private let reactNativeDelegate = ReactNativeFactoryDelegate()

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()

    let factory = ExpoReactNativeFactory(delegate: reactNativeDelegate)
    bindReactNativeFactory(factory)

    if window == nil {
      let window = UIWindow(frame: UIScreen.main.bounds)
      self.window = window
      window.makeKeyAndVisible()
    }

    if let window = window, window.rootViewController == nil {
      startReactNative(in: window, launchOptions: launchOptions)
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(
      name: "Default Configuration",
      sessionRole: connectingSceneSession.role
    )
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }

  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options)
      || RCTLinkingManager.application(app, open: url, options: options)
  }

  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler)
      || result
  }

  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    super.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
  }

  override func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    super.application(
      application,
      didReceiveRemoteNotification: userInfo,
      fetchCompletionHandler: completionHandler
    )
  }

  func startReactNative(
    in window: UIWindow,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) {
    guard let factory = factory else {
      assertionFailure("ExpoReactNativeFactory not initialized")
      return
    }
    factory.startReactNative(
      withModuleName: moduleName,
      in: window,
      initialProperties: initialProps,
      launchOptions: launchOptions
    )
  }
}

final class ReactNativeFactoryDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    let bundleSettings = RCTBundleURLProvider.sharedSettings()
    if bundleSettings.jsLocation == nil || bundleSettings.jsLocation?.isEmpty == true {
      let hostPort = bundleSettings.packagerServerHostPort()
      if !hostPort.isEmpty {
        bundleSettings.jsLocation = hostPort
      } else {
        bundleSettings.jsLocation = "localhost:8081"
      }
      bundleSettings.packagerScheme = "http"
    }

    let devURL = bundleSettings.jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
    if devURL != nil {
      return devURL
    }
    let fallbackURL = bundleSettings.jsBundleURL(forBundleRoot: "index")
    return fallbackURL
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    let window = (UIApplication.shared.delegate as? AppDelegate)?.window ?? UIWindow()
    window.windowScene = windowScene
    self.window = window

    if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
      appDelegate.window = window
      if window.rootViewController == nil {
        appDelegate.startReactNative(in: window, launchOptions: nil)
      }
    } else {
      assertionFailure("AppDelegate not available")
    }

    window.makeKeyAndVisible()
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard !URLContexts.isEmpty else { return }
    for context in URLContexts {
      var options: [UIApplication.OpenURLOptionsKey: Any] = [:]
      if let sourceApp = context.options.sourceApplication {
        options[.sourceApplication] = sourceApp
      }
      if let annotation = context.options.annotation {
        options[.annotation] = annotation
      }
      _ = RCTLinkingManager.application(UIApplication.shared, open: context.url, options: options)
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}
