param(
    [Parameter(Mandatory = $true)]
    [string]$Signature,

    [string]$PublicCertPath = "/app/config/netopia/public.cer",

    [string]$StartUrl = "https://secure.sandbox.netopia-payments.com/payment/card/start",

    [string]$ReturnUrl = "http://localhost:3000/orders",

    [string]$EnvPath = ".env"
)

$resolvedEnvPath = (Resolve-Path $EnvPath -ErrorAction SilentlyContinue)
if ($null -eq $resolvedEnvPath) {
    throw "Environment file not found: $EnvPath"
}

$lines = Get-Content $resolvedEnvPath
$updated = New-Object System.Collections.Generic.List[string]
$foundSignature = $false
$foundCertPath = $false
$foundStartUrl = $false
$foundReturnUrl = $false

foreach ($line in $lines) {
    if ($line -match '^NETOPIA_SIGNATURE=') {
        $updated += "NETOPIA_SIGNATURE=$Signature"
        $foundSignature = $true
    } elseif ($line -match '^NETOPIA_PUBLIC_CERT_PATH=') {
        $updated += "NETOPIA_PUBLIC_CERT_PATH=$PublicCertPath"
        $foundCertPath = $true
    } elseif ($line -match '^NETOPIA_START_URL=') {
        $updated += "NETOPIA_START_URL=$StartUrl"
        $foundStartUrl = $true
    } elseif ($line -match '^NETOPIA_RETURN_URL=') {
        $updated += "NETOPIA_RETURN_URL=$ReturnUrl"
        $foundReturnUrl = $true
    } else {
        $updated += $line
    }
}

if (-not $foundSignature) {
    $updated += "NETOPIA_SIGNATURE=$Signature"
}
if (-not $foundCertPath) {
    $updated += "NETOPIA_PUBLIC_CERT_PATH=$PublicCertPath"
}
if (-not $foundStartUrl) {
    $updated += "NETOPIA_START_URL=$StartUrl"
}
if (-not $foundReturnUrl) {
    $updated += "NETOPIA_RETURN_URL=$ReturnUrl"
}

$updated | Set-Content $resolvedEnvPath -Encoding UTF8
Write-Host "Updated NETOPIA settings in $resolvedEnvPath"
