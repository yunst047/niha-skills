# koyuki — statusline badge (Windows). Prints the active mode if the flag exists.
# Reads %CLAUDE_CONFIG_DIR%\.koyuki-active or ~\.claude\.koyuki-active.

$claudeDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME ".claude" }
$flag = Join-Path $claudeDir ".koyuki-active"

if (-not (Test-Path $flag)) { exit 0 }

$mode = (Get-Content $flag -Raw -ErrorAction SilentlyContinue).Trim()
$label = switch ($mode) {
  "lite"  { "CHILL" }
  "full"  { "NIHAHA" }
  "ultra" { "NIHAHAHACK" }
  "crack" { "CRACK" }
  ""      { exit 0 }
  default { $mode.ToUpper() }
}

Write-Host -NoNewline "[KOYUKI:$label]"
