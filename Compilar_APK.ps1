$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$studio = Join-Path $env:ProgramFiles 'Android\Android Studio'
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.13.102-hotspot"
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) { throw 'Instala Android Studio o configura JAVA_HOME con JDK 17 o 21.' }
$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
if (-not $sdk) { $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (-not (Test-Path "$sdk\platforms\android-35\android.jar")) { throw 'Abre Android Studio > SDK Manager e instala Android SDK Platform 35 (Android 15) y Android SDK Build-Tools 35.0.0.' }
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$sdkProperty = $sdk.Replace('\','/')
Set-Content -Path local.properties -Value "sdk.dir=$sdkProperty" -Encoding ASCII
$gradleHome = Join-Path $env:LOCALAPPDATA 'SicorpVentas\Gradle'
$gradle = Join-Path $gradleHome 'gradle-8.9\bin\gradle.bat'
if (-not (Test-Path $gradle)) {
    New-Item -ItemType Directory -Path $gradleHome -Force | Out-Null
    $zip = Join-Path $gradleHome 'gradle-8.9-bin.zip'
    $url = 'https://services.gradle.org/distributions/gradle-8.9-bin.zip'
    Write-Host 'Descargando Gradle 8.9 desde su distribucion oficial...'
    Invoke-WebRequest -Uri $url -OutFile $zip
    $expected = (Invoke-RestMethod -Uri ($url + '.sha256')).Trim()
    if ((Get-FileHash $zip -Algorithm SHA256).Hash.ToLower() -ne $expected.ToLower()) { throw 'La comprobacion SHA256 de Gradle fallo.' }
    Expand-Archive -Path $zip -DestinationPath $gradleHome -Force
}
& $gradle --no-daemon :app:assembleDebug
if ($LASTEXITCODE -ne 0) { throw 'La compilacion de Gradle fallo. Revisa el mensaje anterior.' }
$source = Join-Path $PSScriptRoot 'app\build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $source)) { throw 'No se encontro el APK generado.' }
$dest = Join-Path $PSScriptRoot 'Sicorpmattress_Ventas.apk'
Copy-Item $source $dest -Force
Write-Host "APK generado: $dest" -ForegroundColor Green

