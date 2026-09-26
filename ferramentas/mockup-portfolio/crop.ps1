param(
  [string]$InputPath,
  [string]$OutputPath,
  [int]$Left = 4,
  [int]$Top = 4,
  [int]$Right = 4,
  [int]$Bottom = 4
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile($InputPath)
$w = $src.Width - $Left - $Right
$h = $src.Height - $Top - $Bottom

$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$srcRect = New-Object System.Drawing.Rectangle $Left, $Top, $w, $h
$destRect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$src.Dispose()

Write-Output "OK: $OutputPath ($w x $h)"
