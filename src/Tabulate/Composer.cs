using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace Tabulate;

public class Composer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        _ = builder.ManifestFilters().Append<ManifestFilter>();
    }
}
