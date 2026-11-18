@echo off
title Laison Recap Offline
if exist "%~dp0Laison_Device_Recap_Offline.html" (
  start "" "%~dp0Laison_Device_Recap_Offline.html"
) else (
  start "" "%~dp0AquaLink_Device_Recap_Offline.html"
)
exit
