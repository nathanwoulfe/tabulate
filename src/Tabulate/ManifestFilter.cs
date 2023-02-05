using Umbraco.Cms.Core.Manifest;

namespace Tabulate;

internal sealed class ManifestFilter : IManifestFilter
{
    /// <inheritdoc/>
    public void Filter(List<PackageManifest> manifests) => manifests.Add(new PackageManifest
    {
        PackageName = "Tabulate",
        Scripts = new[]
        {
            "/App_Plugins/Tabulate/Backoffice/tabulate.min.js",
        },
        Stylesheets = new[]
        {
            "/App_Plugins/Tabulate/Backoffice/tabulate.min.css",
        },
        BundleOptions = BundleOptions.None,
    });
}
