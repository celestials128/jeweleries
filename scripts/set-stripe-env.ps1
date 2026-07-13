param(
    [Parameter(Mandatory = $true)]
    [string]$SecretKey,

    [string]$WebhookSecret = "",

    [string]$EnvPath = ".env.production"
)

$resolvedEnvPath = (Resolve-Path $EnvPath -ErrorAction SilentlyContinue)
if ($null -eq $resolvedEnvPath) {
    throw "Environment file not found: $EnvPath"
}

$lines = Get-Content $resolvedEnvPath
$updated = New-Object System.Collections.Generic.List[string]
$foundSecretKey = $false
$foundWebhookSecret = $false

foreach ($line in $lines) {
    if ($line -match '^STRIPE_SECRET_KEY=') {
        $updated += "STRIPE_SECRET_KEY=$SecretKey"
        $foundSecretKey = $true
    } elseif ($line -match '^STRIPE_WEBHOOK_SECRET=') {
        $updated += "STRIPE_WEBHOOK_SECRET=$WebhookSecret"
        $foundWebhookSecret = $true
    } else {
        $updated += $line
    }
}

if (-not $foundSecretKey) {
    $updated += "STRIPE_SECRET_KEY=$SecretKey"
}
if (-not $foundWebhookSecret -and $WebhookSecret -ne "") {
    $updated += "STRIPE_WEBHOOK_SECRET=$WebhookSecret"
}

$updated | Set-Content $resolvedEnvPath -Encoding UTF8
Write-Host "Updated Stripe settings in $resolvedEnvPath"
