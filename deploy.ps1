if (Test-Path .\docs\) { Remove-Item -Recurse .\docs\ }
cd .\src\whichmovietowatch/
ng build --prod --deploy-url="whichmovietowatch/"
cd ..\..
Robocopy.exe .\src\whichmovietowatch\dist\whichmovietowatch .\docs /MIR
Robocopy.exe .\src\whichmovietowatch\dist\whichmovietowatch .\docs\whichmovietowatch /MIR
git add --all .
git commit -m "deploy update"
git push --force