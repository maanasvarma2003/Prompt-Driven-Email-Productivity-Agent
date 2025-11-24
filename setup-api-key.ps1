# PowerShell script to set your Groq API key
# Usage: .\setup-api-key.ps1 -ApiKey "your_groq_api_key_here"

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$envFile = ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    $lines = @(
        "# Groq API Key Configuration",
        "# Get your API key from: https://console.groq.com",
        "GROQ_API_KEY=$ApiKey"
    )
    $lines | Out-File -FilePath $envFile -Encoding utf8
    Write-Host "[OK] .env.local file created with your API key!" -ForegroundColor Green
} else {
    Write-Host "Updating .env.local file..." -ForegroundColor Yellow
    $content = Get-Content $envFile -Raw
    if ($content -match "GROQ_API_KEY=") {
        $content = $content -replace "GROQ_API_KEY=.*", "GROQ_API_KEY=$ApiKey"
        $content | Set-Content $envFile -Encoding utf8
        Write-Host "[OK] API key updated in .env.local!" -ForegroundColor Green
    } else {
        Add-Content -Path $envFile -Value "GROQ_API_KEY=$ApiKey" -Encoding utf8
        Write-Host "[OK] API key added to .env.local!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server (if running)" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Test the chatbot - it should work now!" -ForegroundColor White
Write-Host ""
