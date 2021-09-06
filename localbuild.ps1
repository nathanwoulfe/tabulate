  
## clean up from previous runs
rm -r -force nupkgs
rm -r -force ./src/Tabulate.Umbraco/App_Plugins
mkdir nupkgs

## install backoffice dependencies
cd ./src/Tabulate.Umbraco
npm install
npm run build
cd ../../

## pack individually to avoid plumber.site blowing up
dotnet pack ./src/Tabulate.Umbraco.ValueConverters/Tabulate.Umbraco.ValueConverters.csproj -c Release -o nupkgs
dotnet pack ./src/Tabulate.Umbraco/Tabulate.Umbraco.csproj -c Release -o nupkgs