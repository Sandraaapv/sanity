# PowerShell Bootstrap Runner for Spring Boot Backend
$MavenVersion = "3.9.6"
$MavenDir = Join-Path $PSScriptRoot ".maven"
$MavenHome = Join-Path $MavenDir "apache-maven-$MavenVersion"
$MvnPath = Join-Path $MavenHome "bin\mvn.cmd"

if (-not (Test-Path $MvnPath)) {
    Write-Host "Local Maven not found. Downloading Apache Maven $MavenVersion..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $MavenDir | Out-Null
    
    $Url = "https://archive.apache.org/dist/maven/maven-3/$MavenVersion/binaries/apache-maven-$MavenVersion-bin.zip"
    $ZipPath = Join-Path $MavenDir "maven.zip"
    
    Write-Host "Fetching $Url..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $Url -OutFile $ZipPath
    
    Write-Host "Extracting Maven binaries..." -ForegroundColor Gray
    Expand-Archive -Path $ZipPath -DestinationPath $MavenDir -Force
    
    Write-Host "Cleaning up temp zip file..." -ForegroundColor Gray
    Remove-Item $ZipPath -Force
    
    Write-Host "Maven installed successfully under: $MavenHome" -ForegroundColor Green
}

# Add local maven bin directory to PATH for the duration of this process
$env:PATH = "$(Join-Path $MavenHome 'bin');$env:PATH"

Write-Host "Starting Spring Boot application on http://localhost:8080..." -ForegroundColor Green
& $MvnPath spring-boot:run
