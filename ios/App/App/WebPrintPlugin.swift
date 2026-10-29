import UIKit
import WebKit
import Capacitor

/// Print / Save as PDF for the app. The in-app web view doesn't handle window.print(), so the page
/// asks for this instead: it opens the iOS print sheet for the current page (Share → Save to Files
/// gives a PDF).
@objc(WebPrintPlugin)
public class WebPrintPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WebPrintPlugin"
    public let jsName = "WebPrint"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "print", returnType: CAPPluginReturnPromise)
    ]

    @objc func print(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? "MandalHisab"
        DispatchQueue.main.async {
            guard let webView = self.bridge?.webView else {
                call.reject("Printing isn't available")
                return
            }
            let info = UIPrintInfo(dictionary: nil)
            info.outputType = .general
            info.jobName = title
            let controller = UIPrintInteractionController.shared
            controller.printInfo = info
            controller.printFormatter = webView.viewPrintFormatter()
            let done: UIPrintInteractionController.CompletionHandler = { _, completed, error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve(["completed": completed])
                }
            }
            if UIDevice.current.userInterfaceIdiom == .pad, let view = self.bridge?.viewController?.view {
                let anchor = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
                controller.present(from: anchor, in: view, animated: true, completionHandler: done)
            } else {
                controller.present(animated: true, completionHandler: done)
            }
        }
    }
}

/// The app's web view controller: registers the app's own plugins (set in Main.storyboard).
class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WebPrintPlugin())
    }
}
