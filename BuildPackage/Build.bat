ECHO REPO_BRANCH: %APPVEYOR_REPO_BRANCH%
ECHO REPO_TAG: %APPVEYOR_REPO_TAG%
ECHO BUILD_NUMBER : %APPVEYOR_BUILD_NUMBER%
ECHO BUILD_VERSION : %APPVEYOR_BUILD_VERSION%
ECHO UMBRACO_PACKAGE_PRERELEASE_SUFFIX : %UMBRACO_PACKAGE_PRERELEASE_SUFFIX%
cd ..\Tabulate\App_Plugins\Tabulate
Call npm install
Call npm run build
cd ..\..\..\BuildPackage\
Call Tools\nuget.exe restore ..\Tabulate.sln
:: build the project, update the nuspec and package.xml files, create umbraco package
Call "%programfiles(x86)%\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\MSBuild.exe" package.proj