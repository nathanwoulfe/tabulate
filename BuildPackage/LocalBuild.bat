ECHO off

SET /P BUILD_NUMBER=Please enter a build number (e.g. 134):
SET /P PACKAGE_VERISON=Please enter your package version (e.g. 1.0.5):
SET /P UMBRACO_PACKAGE_PRERELEASE_SUFFIX=Please enter your package release suffix or leave empty (e.g. beta):

SET /P REPO_TAG=If you want to simulate a GitHub tag for a release (e.g. true):

if "%BUILD_NUMBER%" == "" (
  SET BUILD_NUMBER=100
)
if "%PACKAGE_VERISON%" == "" (
  SET PACKAGE_VERISON=0.1.0
)

SET BUILD_VERSION=%PACKAGE_VERISON%.%BUILD_NUMBER%

build.bat

@IF %ERRORLEVEL% NEQ 0 GOTO err
@EXIT /B 0
:err
@PAUSE
@EXIT /B 1