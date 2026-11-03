$ErrorActionPreference = "Stop"

$javaHome = "C:\Program Files\Android\Android Studio\jbr"
$androidHome = "$env:LOCALAPPDATA\Android\Sdk"

Write-Host "Setting JAVA_HOME to: $javaHome"
$env:JAVA_HOME = $javaHome
$env:PATH = "$javaHome\bin;" + $env:PATH

Write-Host "Setting ANDROID_HOME to: $androidHome"
$env:ANDROID_HOME = $androidHome

Push-Location "android"
try {
    Write-Host "Starting Gradle assembleDebug..."
    cmd /c "gradlew.bat assembleDebug"
} finally {
    Pop-Location
}

