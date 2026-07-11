param(
    [Parameter(Mandatory = $true)]
    [string]$WebhookSecret,

    [string]$EnvPath = "$(Join-Path $PSScriptRoot '..\.env')"
)

$resolvedEnvPath = [System.IO.Path]::GetFullPath($EnvPath)

if (-not (Test-Path $resolvedEnvPath)) {
    throw "Cannot find .env file at $resolvedEnvPath"
}

$lines = Get-Content $resolvedEnvPath
$updated = @()
$foundWebhook = $false

foreach ($line in $lines) {
    if ($line -match '^STRIPE_WEBHOOK_SECRET=') {
        $updated += "STRIPE_WEBHOOK_SECRET=$WebhookSecret"
        $foundWebhook = $true
    } else {
        $updated += $line
    }
}

if (-not $foundWebhook) {
    $updated += "STRIPE_WEBHOOK_SECRET=$WebhookSecret"
}

Set-Content -Path $resolvedEnvPath -Value $updated -Encoding UTF8
Write-Host "Updated STRIPE_WEBHOOK_SECRET in $resolvedEnvPath"
