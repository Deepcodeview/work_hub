# ==============================================================================
# WorkHub Native Android APK Builder
# Uses installed Android SDK Build-Tools and JDK to compile, package, align,
# and sign a 100% genuine, installable Android APK package.
# ==============================================================================

$ErrorActionPreference = "Stop"

$BUILD_TOOLS = "C:\Users\ideep\AppData\Local\Android\Sdk\build-tools\34.0.0"
$PLATFORM_JAR = "C:\Users\ideep\AppData\Local\Android\Sdk\platforms\android-34\android.jar"
$JDK_BIN = "C:\Program Files\Java\jdk-25.0.2\bin"

$AAPT2 = "$BUILD_TOOLS\aapt2.exe"
$ZIPALIGN = "$BUILD_TOOLS\zipalign.exe"
$D8_JAR = "$BUILD_TOOLS\lib\d8.jar"
$APKSIGNER_JAR = "$BUILD_TOOLS\lib\apksigner.jar"
$JAVAC = "$JDK_BIN\javac.exe"
$KEYTOOL = "$JDK_BIN\keytool.exe"
$JAVA = "$JDK_BIN\java.exe"

$WORK_DIR = "$PSScriptRoot\..\android-build-tmp"

function Write-Utf8NoBom($path, $content) {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
}

Write-Host ">>> [1/8] Cleaning and setting up temporary build workspace..." -ForegroundColor Cyan
if (Test-Path $WORK_DIR) {
    Remove-Item -Recurse -Force $WORK_DIR
}

New-Item -ItemType Directory -Path "$WORK_DIR\res\values" -Force | Out-Null
New-Item -ItemType Directory -Path "$WORK_DIR\res\mipmap-mdpi" -Force | Out-Null
New-Item -ItemType Directory -Path "$WORK_DIR\res\mipmap-hdpi" -Force | Out-Null
New-Item -ItemType Directory -Path "$WORK_DIR\res\mipmap-xhdpi" -Force | Out-Null
New-Item -ItemType Directory -Path "$WORK_DIR\res\mipmap-xxhdpi" -Force | Out-Null
New-Item -ItemType Directory -Path "$WORK_DIR\src\com\workhub\mobile" -Force | Out-Null
New-Item -ItemType Directory -Path "$WORK_DIR\bin\classes" -Force | Out-Null
New-Item -ItemType Directory -Path "$WORK_DIR\bin\dex" -Force | Out-Null

Write-Host ">>> [2/8] Generating launcher and PWA icons..." -ForegroundColor Cyan
Add-Type -AssemblyName System.Drawing
function Generate-Icon($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Orange brand background
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 122, 0))
    $g.FillEllipse($brush, 2, 2, $size - 4, $size - 4)
    
    # White "W" logo
    $fontSize = [int]($size * 0.48)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF 0, 0, $size, $size
    $g.DrawString("W", $font, [System.Drawing.Brushes]::White, $rect, $sf)
    
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Generate-Icon 48 "$WORK_DIR\res\mipmap-mdpi\ic_launcher.png"
Generate-Icon 72 "$WORK_DIR\res\mipmap-hdpi\ic_launcher.png"
Generate-Icon 96 "$WORK_DIR\res\mipmap-xhdpi\ic_launcher.png"
Generate-Icon 144 "$WORK_DIR\res\mipmap-xxhdpi\ic_launcher.png"

# Also generate web PNG icons for PWA
$PWA_ICONS_DIR = "$PSScriptRoot\..\apps\web\public\icons"
New-Item -ItemType Directory -Path $PWA_ICONS_DIR -Force | Out-Null
Generate-Icon 192 "$PWA_ICONS_DIR\icon-192.png"
Generate-Icon 512 "$PWA_ICONS_DIR\icon-512.png"

Write-Host ">>> [3/8] Writing Android resources and Manifest (without BOM)..." -ForegroundColor Cyan
$stringsXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">WorkHub</string>
</resources>
"@
Write-Utf8NoBom "$WORK_DIR\res\values\strings.xml" $stringsXml

$manifestXml = @"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.workhub.mobile"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk
        android:minSdkVersion="24"
        android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"@
Write-Utf8NoBom "$WORK_DIR\AndroidManifest.xml" $manifestXml

Write-Host ">>> [4/8] Writing MainActivity.java..." -ForegroundColor Cyan
$mainActivityJava = @"
package com.workhub.mobile;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

public class MainActivity extends Activity {
    private WebView mWebView;
    private ProgressBar mProgressBar;
    public static final String APP_URL = "http://16.179.236.212:3000";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#FF7A00"));
        }

        FrameLayout layout = new FrameLayout(this);
        layout.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        layout.setBackgroundColor(Color.parseColor("#FBF9F5"));

        mWebView = new WebView(this);
        mWebView.setLayoutParams(new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));

        mProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        FrameLayout.LayoutParams pbParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            12
        );
        mProgressBar.setLayoutParams(pbParams);
        mProgressBar.setMax(100);
        mProgressBar.setProgress(0);

        layout.addView(mWebView);
        layout.addView(mProgressBar);
        setContentView(layout);

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setUserAgentString(settings.getUserAgentString() + " WorkHubApp/1.0");

        mWebView.setWebChromeClient(new WorkHubChromeClient(mProgressBar));
        mWebView.setWebViewClient(new WorkHubWebClient());

        mWebView.loadUrl(APP_URL);
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.destroy();
        }
        super.onDestroy();
    }

    public static class WorkHubChromeClient extends WebChromeClient {
        private final ProgressBar progressBar;

        public WorkHubChromeClient(ProgressBar bar) {
            this.progressBar = bar;
        }

        @Override
        public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
            callback.invoke(origin, true, false);
        }

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            if (progressBar != null) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        }
    }

    public static class WorkHubWebClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return false;
        }

        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            String html = "<html><body style='display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;background:#FBF9F5;color:#1F2937;'>"
                + "<div><h2 style='color:#FF7A00;'>WorkHub Offline</h2>"
                + "<p>Unable to connect to WorkHub server (" + MainActivity.APP_URL + ").</p>"
                + "<p style='color:#666;'>Please check your internet connection.</p>"
                + "<button onclick='location.reload()' style='background:#FF7A00;color:white;border:none;padding:12px 24px;border-radius:24px;font-weight:bold;margin-top:16px;'>Retry Connection</button>"
                + "</div></body></html>";
            view.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
        }
    }
}
"@
Write-Utf8NoBom "$WORK_DIR\src\com\workhub\mobile\MainActivity.java" $mainActivityJava

Write-Host ">>> [5/8] Compiling Android resources with AAPT2..." -ForegroundColor Cyan
& $AAPT2 compile --dir "$WORK_DIR\res" -o "$WORK_DIR\compiled_res.zip"
if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed" }

Write-Host ">>> [6/8] Linking APK package with AAPT2 and generating R.java..." -ForegroundColor Cyan
& $AAPT2 link -I $PLATFORM_JAR "$WORK_DIR\compiled_res.zip" `
    --manifest "$WORK_DIR\AndroidManifest.xml" `
    --java "$WORK_DIR\src" `
    -o "$WORK_DIR\unaligned.apk"
if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed" }

Write-Host ">>> [7/8] Compiling Java source code with javac..." -ForegroundColor Cyan
$javaSources = (Get-ChildItem -Path "$WORK_DIR\src" -Filter "*.java" -Recurse | ForEach-Object { $_.FullName })
& $JAVAC --release 8 -cp $PLATFORM_JAR $javaSources -d "$WORK_DIR\bin\classes"
if ($LASTEXITCODE -ne 0) { throw "javac compilation failed" }

Write-Host ">>> [8/8] Converting bytecode to classes.dex using D8..." -ForegroundColor Cyan
$classFiles = (Get-ChildItem -Path "$WORK_DIR\bin\classes" -Filter "*.class" -Recurse | ForEach-Object { $_.FullName })
& $JAVA -cp $D8_JAR com.android.tools.r8.D8 --lib $PLATFORM_JAR --release --output "$WORK_DIR\bin\dex" $classFiles
if ($LASTEXITCODE -ne 0) { throw "D8 dex generation failed" }

Write-Host ">>> [9/8] Packaging classes.dex into APK container..." -ForegroundColor Cyan
Push-Location "$WORK_DIR\bin\dex"
& "$JDK_BIN\jar.exe" -uf "$WORK_DIR\unaligned.apk" classes.dex
Pop-Location
if ($LASTEXITCODE -ne 0) { throw "jar packaging failed" }

Write-Host ">>> [10/8] Zipaligning APK to 4-byte boundaries..." -ForegroundColor Cyan
& $ZIPALIGN -p -f 4 "$WORK_DIR\unaligned.apk" "$WORK_DIR\aligned.apk"
if ($LASTEXITCODE -ne 0) { throw "zipalign failed" }

Write-Host ">>> [11/8] Ensuring Release Keystore exists..." -ForegroundColor Cyan
$KEYSTORE = "$PSScriptRoot\release.keystore"
if (-not (Test-Path $KEYSTORE)) {
    & $KEYTOOL -genkeypair -v -keystore $KEYSTORE -alias workhub -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass workhub123 -keypass workhub123 `
        -dname "CN=WorkHub, OU=Mobile, O=WorkHub Inc, L=New York, S=NY, C=US"
    Write-Host "Created release keystore at $KEYSTORE" -ForegroundColor Green
}

Write-Host ">>> [12/8] Signing APK with apksigner (v1 + v2 + v3 signatures)..." -ForegroundColor Cyan
$FINAL_APK_NAME = "workhub-v1.0.0.apk"
$OUTPUT_DIR = "$PSScriptRoot\..\apps\web\public\downloads"
New-Item -ItemType Directory -Path $OUTPUT_DIR -Force | Out-Null
$TARGET_APK = "$OUTPUT_DIR\$FINAL_APK_NAME"
$TARGET_LATEST = "$OUTPUT_DIR\workhub-latest.apk"

& $JAVA -jar $APKSIGNER_JAR sign --ks $KEYSTORE --ks-pass pass:workhub123 `
    --ks-key-alias workhub --key-pass pass:workhub123 `
    --v1-signing-enabled true --v2-signing-enabled true `
    --out $TARGET_APK "$WORK_DIR\aligned.apk"
if ($LASTEXITCODE -ne 0) { throw "apksigner failed" }

Copy-Item $TARGET_APK $TARGET_LATEST -Force

Write-Host ">>> [13/8] Verifying APK signature..." -ForegroundColor Cyan
& $JAVA -jar $APKSIGNER_JAR verify --verbose $TARGET_APK

$fileInfo = Get-Item $TARGET_APK
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "SUCCESS! Compiled and signed installable APK package:" -ForegroundColor Green
Write-Host "Path: $TARGET_APK" -ForegroundColor Green
Write-Host "Size: $($fileInfo.Length) bytes ($([math]::Round($fileInfo.Length / 1024, 2)) KB)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# Cleanup temp
Remove-Item -Recurse -Force $WORK_DIR
