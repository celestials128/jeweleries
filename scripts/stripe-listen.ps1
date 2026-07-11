param(
    [string]$ForwardUrl = "http://host.docker.internal:8080/api/stripe/webhook",
    [string]$ConfigDir = "$($env:USERPROFILE)\.stripe-cli"
)

New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null

docker run --rm -it `
    -v "${ConfigDir}:/root/.config/stripe" `
    stripe/stripe-cli:latest listen --forward-to $ForwardUrl
