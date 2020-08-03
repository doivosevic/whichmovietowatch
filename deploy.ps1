if (Test-Path .\docs\) { Remove-Item -Recurse .\docs\ }
cd .\src\whichmovietowatch/
ng build --prod --deploy-url="whichmovietowatch/"
cd ..\..
Robocopy.exe .\src\whichmovietowatch\dist .\docs
git add --all .
git push --force