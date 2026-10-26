# koyuki - statusline badge (Windows). Prints the active mode if the flag exists,
# combined with Yuuka's when yuuka-skill is active too: [KOYUKI:NIHAHA|YUUKA:LEDGER]
# Reads %CLAUDE_CONFIG_DIR%\.koyuki-active / .yuuka-active or ~\.claude\...

$claudeDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME ".claude" }

function Read-Flag($name) {
  $flag = Join-Path $claudeDir $name
  if (-not (Test-Path $flag)) { return "" }
  $raw = Get-Content $flag -Raw -ErrorAction SilentlyContinue
  if ($null -eq $raw) { return "" }
  return $raw.Trim()
}

$badges = @()

$mode = Read-Flag ".koyuki-active"
if ($mode) {
  $badges += "KOYUKI:" + $(switch ($mode) {
    "lite"  { "CHILL" }
    "full"  { "NIHAHA" }
    "ultra" { "NIHAHAHACK" }
    default { $mode.ToUpper() }
  })
}

$ymode = Read-Flag ".yuuka-active"
if ($ymode) {
  $badges += "YUUKA:" + $(switch ($ymode) {
    "lite"  { "ALLOWANCE" }
    "full"  { "LEDGER" }
    "ultra" { "DEFICIT" }
    default { $ymode.ToUpper() }
  })
}

if ($badges.Count -eq 0) { exit 0 }
Write-Host -NoNewline ("[" + ($badges -join "|") + "]")
