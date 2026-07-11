param(
    [Parameter(Mandatory = $true)]
    [string]$SecretKey,

    [string]$PublishableKey = "",

    [string]$EnvPath = "$(Join-Path $PSScriptRoot '..\.env')"
)

$resolvedEnvPath = [System.IO.Path]::GetFullPath($EnvPath)

if (-not (Test-Path $resolvedEnvPath)) {
    throw "Cannot find .env file at $resolvedEnvPath"
}

$lines = Get-Content $resolvedEnvPath
$updated = @()
$foundSecret = $false
$foundPublishable = $false

foreach ($line in $lines) {
    if ($line -match '^STRIPE_SECRET_KEY=') {
        $updated += "STRIPE_SECRET_KEY=$SecretKey"
        $foundSecret = $true
    } elseif ($line -match '^VITE_STRIPE_PK=') {
        if ($PublishableKey -ne "") {
            $updated += "VITE_STRIPE_PK=$PublishableKey"
        } else {
            $updated += $line
        }
        $foundPublishable = $true
    } else {
        $updated += $line
    }
}

if (-not $foundSecret) {
    $updated += "STRIPE_SECRET_KEY=$SecretKey"
}

if ($PublishableKey -ne "" -and -not $foundPublishable) {
    $updated += "VITE_STRIPE_PK=$PublishableKey"
}

Set-Content -Path $resolvedEnvPath -Value $updated -Encoding UTF8
Write-Host "Updated $resolvedEnvPath"
