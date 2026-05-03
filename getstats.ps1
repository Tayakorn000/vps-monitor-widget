$os=Get-WmiObject Win32_OperatingSystem
$cpu=(Get-WmiObject Win32_Processor).LoadPercentage
$t=[math]::Round($os.TotalVisibleMemorySize/1024)
$f=[math]::Round($os.FreePhysicalMemory/1024)
$u=$t-$f
$p=[math]::Round($u*100/$t)
Write-Output "$cpu|$u|$t|$p"
